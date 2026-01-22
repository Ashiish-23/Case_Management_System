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
   (ATOMIC OPERATION)
========================= */
router.post("/add", auth, upload.single("image"), async (req, res) => {
  const client = await pool.connect();

  try {
    const officerId = req.user.userId;
    const { caseId, description, category } = req.body;
    const imagePath = req.file ? req.file.filename : null;

    await client.query("BEGIN");

    // 1️⃣ Get station name from CASE (single source of truth)
    const caseResult = await client.query(
      "SELECT station_name FROM cases WHERE id = $1",
      [caseId]
    );

    if (!caseResult.rowCount) {
      throw new Error("Case not found");
    }

    const stationName = caseResult.rows[0].station_name;

    // 2️⃣ Generate evidence code (safe sequence)
    const codeResult = await client.query(`
      SELECT 'EVD-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
      LPAD(nextval('evidence_seq')::text, 6, '0') AS code
    `);

    const evidenceCode = codeResult.rows[0].code;

    // 3️⃣ Insert evidence
    const evidenceResult = await client.query(`
      INSERT INTO evidence
        (case_id, evidence_code, description, category, image_url, logged_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id
    `, [
      caseId,
      evidenceCode,
      description,
      category,
      imagePath,
      officerId
    ]);

    const evidenceId = evidenceResult.rows[0].id;

    // 4️⃣ Initialize custody (MANDATORY)
    await client.query(`
      INSERT INTO evidence_custody (
        evidence_id,
        case_id,
        current_holder_id,
        storage_station,
        custody_status
      )
      VALUES ($1, $2, $3, $4, 'ACTIVE')
    `, [
      results.rows[0].id,
      caseId,
      officerId,
      stationName
    ]);

    await client.query("COMMIT");

    res.json({
      success: true,
      evidenceId,
      evidenceCode
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to add evidence" });
  } finally {
    client.release();
  }
});

/* =========================
   LIST EVIDENCE FOR CASE
========================= */
router.get("/case/:caseId", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.evidence_code,
        e.description,
        e.category,
        e.logged_at,
        u.full_name AS officer_name
      FROM evidence e
      LEFT JOIN users u ON e.logged_by = u.id
      WHERE e.case_id = $1
      ORDER BY e.logged_at DESC
    `, [req.params.caseId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
