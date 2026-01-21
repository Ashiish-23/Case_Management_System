const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

router.get("/ping", (req, res) => {
  res.json({ ok: true });
});


/* =========================================================
   CREATE NEW EVIDENCE (FOUNDATION OF CHAIN)
========================================================= */
router.post("/create", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      caseId,
      description,
      category,
      originStation,
      originLocation,
      seizureContext
    } = req.body;

    if (
      !caseId ||
      !description ||
      !category ||
      !originStation ||
      !originLocation ||
      !seizureContext
    ) {
      return res.status(400).json({
        error: "All evidence fields are required"
      });
    }

    await client.query("BEGIN");

    /* 1️⃣ Verify case exists and is OPEN */
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

    /* 2️⃣ Generate evidence code */
    const codeRes = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM evidence
      `
    );

    const evidenceCode = `EVD-${new Date().getFullYear()}-${String(
      codeRes.rows[0].count + 1
    ).padStart(6, "0")}`;

    /* 3️⃣ Insert evidence */
    const evidenceRes = await client.query(
      `
      INSERT INTO evidence (
        case_id,
        evidence_code,
        description,
        category,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id
      `,
      [
        caseId,
        evidenceCode,
        description.trim(),
        category.trim(),
        req.user.userId
      ]
    );

    const evidenceId = evidenceRes.rows[0].id;

    /* 4️⃣ Insert custody (INITIAL STATE) */
    await client.query(
      `
      INSERT INTO evidence_custody (
        evidence_id,
        current_holder_id,
        storage_station,
        storage_location,
        custody_status,
        origin_context,
        updated_at
      )
      VALUES ($1,$2,$3,$4,'ACTIVE',$5,NOW())
      `,
      [
        evidenceId,
        req.user.userId,
        originStation.trim(),
        originLocation.trim(),
        seizureContext.trim()
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
    console.error(err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
