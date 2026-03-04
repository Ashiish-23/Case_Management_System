const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { sendEventEmail } = require("../services/emailService");

/* =========================
   FILE SECURITY CONFIG
========================= */
const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const ALLOWED_TYPES = [ "image/jpeg", "image/png", "image/jpg", "image/webp" ];

const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads/",
    filename: (_, file, cb) => {
      const safeName =
        crypto.randomUUID() +
        path.extname(file.originalname).toLowerCase();
      cb(null, safeName);
    }
  }),

  limits: { fileSize: MAX_FILE_BYTES },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("INVALID_FILE_TYPE"));
    }
    cb(null, true);
  }
});

/* =========================================================
   ADD EVIDENCE
========================================================= */
router.post("/add", auth, upload.single("image"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const officerId = req.user.userId;
    const { caseId, description, category } = req.body;

    if (!caseId || !description || !category || !req.file) {
      return res.status(400).json({
        error: "All fields including valid image are required"
      });
    }

    if (description.length > 1000 || category.length > 100) {
      return res.status(400).json({
        error: "Input too long"
      });
    }

    /* ================= FETCH OFFICER STATION ================= */
    let officerStationId = null;
    let officerStationName = null;

    if (req.user.role === "admin") {
      const adminStation = req.body.seizedAtStation?.trim();

      if (!adminStation)
        return res.status(400).json({ error: "Station required" });

      const stationRes = await client.query( `SELECT id, name, status FROM stations WHERE name = $1`, [adminStation] );

      if (!stationRes.rows.length)
        return res.status(404).json({ error: "Station not found" });

      if (stationRes.rows[0].status !== "active")
        return res.status(403).json({ error: "Station disabled" });

      officerStationId = stationRes.rows[0].id;
      officerStationName = stationRes.rows[0].name;
    } else {
      const stationRes = await client.query( ` SELECT s.id, s.name, s.status FROM officer_station_assignments osa
        JOIN stations s ON osa.station_id = s.id WHERE osa.officer_id = $1 AND osa.relieved_at IS NULL `, [officerId] );

      if (!stationRes.rows.length) {
        return res.status(403).json({
          error: "Officer not assigned to active station"
        });
      }

      if (stationRes.rows[0].status !== "active") {
        return res.status(403).json({
          error: "Assigned station disabled"
        });
      }

      officerStationId = stationRes.rows[0].id;
      officerStationName = stationRes.rows[0].name;
    }

    /* ================= VERIFY CASE ================= */
    const caseRes = await client.query( ` SELECT case_number, station_name FROM cases WHERE id = $1 `, [caseId] );

    if (!caseRes.rows.length) {
      return res.status(404).json({ error: "Case not found" });
    }

    const caseNumber = caseRes.rows[0].case_number;
    const caseStation = caseRes.rows[0].station_name;

    if (req.user.role !== "admin" && caseStation !== officerStationName) {
      return res.status(403).json({
        error: "You cannot add evidence to another station's case"
      });
    }

    /* ================= GENERATE EVIDENCE CODE ================= */
    const codeRes = await client.query(` SELECT 'EVD-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
      LPAD(nextval('evidence_seq')::text, 6, '0') AS code `);

    const evidenceCode = codeRes.rows[0].code;

    /* ================= INSERT EVIDENCE ================= */
    const evidenceInsert = await client.query(` INSERT INTO evidence ( case_id, evidence_code, description, category, image_url,
        logged_by, seized_at_station ) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id `,
      [ caseId, evidenceCode, description.trim(), category.trim(), req.file.filename, officerId, officerStationName ] );

    const evidenceId = evidenceInsert.rows[0].id;

    /* ================= INITIAL CUSTODY ================= */
    await client.query( ` INSERT INTO evidence_custody ( evidence_id, case_id, current_station_id, last_moved_by_user_id,
        updated_at ) VALUES ($1,$2,$3,$4,NOW()) `,
      [ evidenceId, caseId, officerStationId, officerId ] );

    await client.query("COMMIT");

    /* ================= EMAIL SIDE EFFECT ================= */
    try {
      await sendEventEmail({
        eventType: "EVIDENCE_CREATED",
        data: {
          email: req.user.email,
          evidenceCode,
          caseNumber,
          evidenceId,
          station: officerStationName
        },
        db: pool
      });
    } catch (emailErr) {
      console.error("Evidence email failed:", emailErr.message);
    }

    res.json({
      success: true,
      evidenceId,
      evidenceCode
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Add evidence failed:", err);

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: `File too large. Maximum ${MAX_FILE_MB}MB`
      });
    }

    if (err.message === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        error: "Only JPG, PNG, WEBP allowed"
      });
    }

    res.status(500).json({
      error: "Failed to add evidence"
    });
  } finally {
    client.release();
  }
});

/* =========================================================
   LIST EVIDENCE
========================================================= */
router.get("/case/:caseId", auth, async (req, res) => {
  try {
    if (!req.params.caseId) {
      return res.status(400).json({
        error: "Case ID required"
      });
    }

    const result = await pool.query( ` SELECT e.id, e.evidence_code, e.description, e.category, s.name AS current_station, e.logged_at,
        u.full_name AS officer_name FROM evidence e JOIN users u ON e.logged_by = u.id JOIN evidence_custody ec ON e.id = ec.evidence_id
      JOIN stations s ON ec.current_station_id = s.id WHERE e.case_id = $1 ORDER BY e.logged_at DESC `, [req.params.caseId] );

    res.json(result.rows);
  } catch (err) {
    console.error("Load evidence failed:", err.message);

    res.status(500).json({
      error: "Failed to load evidence"
    });
  }
});

module.exports = router;