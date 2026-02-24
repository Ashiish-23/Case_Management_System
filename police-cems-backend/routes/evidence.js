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
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg" ,"image/webp"];

const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads/",
    filename: (_, file, cb) => {
      const safeName =
        crypto.randomUUID() + path.extname(file.originalname).toLowerCase();
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

/* =========================
   ADD EVIDENCE
========================= */
router.post("/add", auth, upload.single("image"), async (req, res) => {
  const client = await pool.connect();

  let evidenceId;
  let evidenceCode;
  let caseNumber;

  try {
    const officerId = req.user.userId;
    const { caseId, description, category, seizedAtStation } = req.body;

    if (
      !caseId ||
      typeof description !== "string" ||
      typeof category !== "string" ||
      typeof seizedAtStation !== "string" ||
      !req.file
    ) {
      return res.status(400).json({
        error: "All fields including valid image are required"
      });
    }

    if (description.length > 1000 || category.length > 100) {
      return res.status(400).json({ error: "Input too long" });
    }

    const station = seizedAtStation.trim();
    if (station.length < 2 || station.length > 100) {
      return res.status(400).json({ error: "Invalid station name" });
    }

    await client.query("BEGIN");

    const caseRes = await client.query(
      "SELECT case_number FROM cases WHERE id = $1",
      [caseId]
    );

    if (!caseRes.rows.length) {
      throw new Error("CASE_NOT_FOUND");
    }

    caseNumber = caseRes.rows[0].case_number;

    const codeRes = await client.query(`
      SELECT
        'EVD-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
        LPAD(nextval('evidence_seq')::text, 6, '0') AS code
    `);

    evidenceCode = codeRes.rows[0].code;

    const evidenceRes = await client.query(
      `
      INSERT INTO evidence (
        case_id,
        evidence_code,
        description,
        category,
        image_url,
        logged_by,
        seized_at_station
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
      `,
      [
        caseId,
        evidenceCode,
        description.trim(),
        category.trim(),
        req.file.filename,
        officerId,
        station
      ]
    );

    evidenceId = evidenceRes.rows[0].id;

    await client.query(
      `
      INSERT INTO evidence_custody (
        evidence_id,
        case_id,
        current_holder_id,
        current_station,
        updated_at
      )
      VALUES ($1,$2,$3,$4,NOW())
      `,
      [evidenceId, caseId, officerId, station]
    );

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Add evidence failed:", err.message);

    /* ⭐ CLEAR ERROR RESPONSES */
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: `File too large. Maximum allowed size is ${MAX_FILE_MB}MB`
      });
    }

    if (err.message === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        error: "Only JPG, PNG, WEBP images are allowed"
      });
    }

    if (err.message === "CASE_NOT_FOUND") {
      return res.status(404).json({ error: "Case not found" });
    }

    return res.status(500).json({ error: "Failed to add evidence" });

  } finally {
    client.release();
  }

  const stationCheck = await pool.query(`SELECT status FROM stations WHERE name = $1`, [station_name] );
  
  if (stationCheck.rows.length === 0) {
    return res.status(404).json({ error: "Station not found" });
  }
  if (stationCheck.rows[0].status !== "active") {
    return res.status(403).json({ error: "Station is disabled" });
  }

  /* ---------- EMAIL SIDE EFFECT ---------- */
  try {
    await sendEventEmail({
      eventType: "EVIDENCE_CREATED",
      data: {
        email: req.user.email,
        evidenceCode,
        caseNumber,
        evidenceId,
        station: req.body.seizedAtStation
      },
      db: pool
    });
  } catch (err) {
    console.error("Evidence email failed:", err.message);
  }

  res.json({
    success: true,
    evidenceId,
    evidenceCode
  });
});

/* =========================
   LIST EVIDENCE
========================= */
router.get("/case/:caseId", auth, async (req, res) => {
  try {
    if (!req.params.caseId) {
      return res.status(400).json({ error: "Case ID required" });
    }

    const result = await pool.query(
      `
      SELECT 
        e.id,
        e.evidence_code,
        e.description,
        e.category,
        ec.current_station,
        e.logged_at,
        u.full_name AS officer_name
      FROM evidence e
      JOIN users u ON e.logged_by = u.id
      JOIN evidence_custody ec ON e.id = ec.evidence_id
      WHERE e.case_id = $1
      ORDER BY e.logged_at DESC
      `,
      [req.params.caseId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Load evidence failed:", err.message);
    res.status(500).json({ error: "Failed to load evidence" });
  }
});

module.exports = router;
