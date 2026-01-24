const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* =========================================================
   CREATE NEW TRANSFER
   (Immediate transfer, no approval flow)
========================================================= */
router.post("/create", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      evidenceId,
      caseId,
      toStation,
      transferType, // TRANSFER | RETURN | EXTERNAL
      remarks
    } = req.body;

    if (!evidenceId || !caseId || !toStation || !transferType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    /* 1️⃣ Validate case */
    const caseRes = await client.query(
      "SELECT status FROM cases WHERE id = $1",
      [caseId]
    );

    if (!caseRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Case not found" });
    }

    if (caseRes.rows[0].status !== "OPEN") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "Transfers not allowed for closed cases"
      });
    }

    /* 2️⃣ Lock current custody */
    const custodyRes = await client.query(
      `
      SELECT *
      FROM evidence_custody
      WHERE evidence_id = $1
      FOR UPDATE
      `,
      [evidenceId]
    );

    if (!custodyRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Custody record not found" });
    }

    const custody = custodyRes.rows[0];

    /* 3️⃣ Insert transfer history */
    await client.query(
      `
      INSERT INTO evidence_transfers (
        evidence_id,
        case_id,
        transfer_type,
        from_station,
        to_station,
        from_user_id,
        remarks
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        evidenceId,
        caseId,
        transferType,
        custody.current_station,
        toStation.trim(),
        req.user.userId,
        remarks || null
      ]
    );

    /* 4️⃣ Update live custody */
    await client.query(
      `
      UPDATE evidence_custody
      SET
        current_station = $1,
        updated_at = NOW()
      WHERE evidence_id = $2
      `,
      [toStation.trim(), evidenceId]
    );

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("TRANSFER ERROR:", err);
    res.status(500).json({ error: "Transfer failed" });
  } finally {
    client.release();
  }
});

/* =========================================================
   GET TRANSFER HISTORY (Per Evidence)
========================================================= */
router.get("/history/:evidenceId", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        t.id,
        t.transfer_type,
        t.from_station,
        t.to_station,
        t.remarks,
        t.transfer_date,
        u.full_name AS transferred_by
      FROM evidence_transfers t
      JOIN users u ON u.id = t.from_user_id
      WHERE t.evidence_id = $1
      ORDER BY t.created_at DESC
      `,
      [req.params.evidenceId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load transfer history" });
  }
});

module.exports = router;
