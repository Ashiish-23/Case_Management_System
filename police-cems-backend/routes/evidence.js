const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const { sendEventEmail } = require("../services/emailService");

/* =========================
   FILE STORAGE (MANDATORY)
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

  let evidenceId;
  let evidenceCode;
  let caseNumber;

  try {
    const officerId = req.user.userId;
    const { caseId, description, category, seizedAtStation } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!caseId || !description || !category || !seizedAtStation || !req.file) {
      return res.status(400).json({
        error: "All fields including image and station are mandatory"
      });
    }

    const station = seizedAtStation.trim();
    const imagePath = req.file.filename;

    /* ---------- TRANSACTION (AUTHORITATIVE) ---------- */
    await client.query("BEGIN");

    // 1️⃣ Verify case exists
    const caseRes = await client.query(
      "SELECT case_number FROM cases WHERE id = $1",
      [caseId]
    );

    if (!caseRes.rows.length) {
      throw new Error("Case not found");
    }

    caseNumber = caseRes.rows[0].case_number;

    // 2️⃣ Generate evidence code
    const codeRes = await client.query(`
      SELECT
        'EVD-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
        LPAD(nextval('evidence_seq')::text, 6, '0') AS code
    `);

    evidenceCode = codeRes.rows[0].code;

    // 3️⃣ Insert evidence (immutable)
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
        station
      ]
    );

    evidenceId = evidenceRes.rows[0].id;

    // 4️⃣ Initialize custody (current truth)
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
    console.error("Add evidence DB failed:", err.message);
    return res.status(500).json({ error: "Failed to add evidence" });
  } finally {
    client.release();
  }

  /* ---------- SIDE-EFFECT ZONE (NON-AUTHORITATIVE) ---------- */
  let emailResult = null;

  try {
    emailResult = await sendEventEmail({
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
    // This should NEVER affect the response
    console.error("Evidence email failed:", err.message);
  }

  /* ---------- FINAL RESPONSE (TRUTHFUL) ---------- */
  res.json({
    success: true,
    evidenceId,
    evidenceCode,
    emailSent: emailResult?.ok ?? false
  });
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
