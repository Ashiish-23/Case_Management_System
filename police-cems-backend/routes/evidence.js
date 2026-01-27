const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

/* =========================
   FILE STORAGE
========================= */
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

/* =========================
   ADD EVIDENCE + INIT CUSTODY
========================= */
router.post("/add", auth, upload.single("image"), async (req, res) => {
  const client = await pool.connect();

  try {
    const officerId = req.user.userId;
    const { caseId, description, category, seizedAtStation } = req.body;
    const imagePath = req.file ? req.file.filename : null;

    if (!caseId || !description || !category || !seizedAtStation) {
      return res.status(400).json({
        error: "All fields including station name are required"
      });
    }

    await client.query("BEGIN");

    /* 1️⃣ Verify case exists & is OPEN */
    const caseRes = await client.query(
      "SELECT status FROM cases WHERE id = $1",
      [caseId]
    );

    if (!caseRes.rows.length) {
      throw new Error("Case not found");
    }

    if (caseRes.rows[0].status !== "OPEN") {
      throw new Error("Cannot add evidence to closed case");
    }

    /* 2️⃣ Generate evidence code (SEQUENCE — SAFE) */
    const codeRes = await client.query(`
      SELECT
        'EVD-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
        LPAD(nextval('evidence_seq')::text, 6, '0') AS code
    `);

    const evidenceCode = codeRes.rows[0].code;

    /* 3️⃣ Insert evidence (historical record) */
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
        imagePath,
        officerId,
        seizedAtStation.trim()
      ]
    );

    const evidenceId = evidenceRes.rows[0].id;

    /* 4️⃣ Initialize custody (CURRENT LOCATION) */
    await client.query(
      `
      INSERT INTO evidence_custody (
        evidence_id,
        case_id,
        current_holder_id,
        current_station,
        custody_status,
        updated_at
      )
      VALUES ($1,$2,$3, $4, 'ACTIVE',NOW())
      `,
      [
        evidenceId,
        caseId,
        officerId,
        seizedAtStation.trim()
      ]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      evidenceId,
      evidenceCode
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Add evidence failed:", err.message);

    res.status(500).json({
      error: "Failed to add evidence"
    });
  } finally {
    client.release();
  }
});

/* =========================
   LIST EVIDENCE FOR CASE
========================= */
router.get("/case/:caseId", auth, async (req, res) => {
  try {
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
      LEFT JOIN users u ON e.logged_by = u.id
      LEFT JOIN evidence_custody ec ON e.id = ec.evidence_id
      WHERE e.case_id = $1
      ORDER BY e.logged_at DESC
      `,
      [req.params.caseId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load evidence" });
  }
});

module.exports = router;
