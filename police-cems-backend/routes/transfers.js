const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* =========================================================
   CREATE NEW TRANSFER (IMMEDIATE, TRUSTED)
========================================================= */
router.post("/create", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      evidenceId,
      toStation,
      toOfficerId,
      toOfficerEmail,
      reason,
      transferType = "INTERNAL" // INTERNAL | EXTERNAL_OUT
    } = req.body;

    /* Basic validation */
    if (!evidenceId || !toStation || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (transferType === "INTERNAL" && (!toOfficerId || !toOfficerEmail)) {
      return res.status(400).json({
        error: "Officer ID and Email required for internal transfer"
      });
    }

    await client.query("BEGIN");

    /* 1️⃣ Verify evidence */
    const evRes = await client.query(
      `SELECT id, case_id FROM evidence WHERE id = $1`,
      [evidenceId]
    );

    if (!evRes.rows.length) {
      throw new Error("Evidence not found");
    }

    const caseId = evRes.rows[0].case_id;

    /* 2️⃣ Lock custody */
    const custodyRes = await client.query(
      `SELECT * FROM evidence_custody WHERE evidence_id = $1 FOR UPDATE`,
      [evidenceId]
    );

    if (!custodyRes.rows.length) {
      throw new Error("Custody record not found");
    }

    const custody = custodyRes.rows[0];

    /* 3️⃣ Resolve officer ONLY for internal transfers */
    let toUserId = null;

    if (transferType === "INTERNAL") {
      const officerRes = await client.query(
        `SELECT id FROM users WHERE login_id = $1 AND email = $2`,
        [toOfficerId, toOfficerEmail]
      );

      if (!officerRes.rows.length) {
        throw new Error("Receiving officer not found or email mismatch");
      }

      toUserId = officerRes.rows[0].id;
    }

    /* 4️⃣ Insert immutable transfer record */
    await client.query(
      `
      INSERT INTO evidence_transfers (
        evidence_id,
        case_id,
        from_user_id,
        from_station,
        to_station,
        transfer_type,
        remarks,
        transfer_date,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE,NOW())
      `,
      [
        evidenceId,
        caseId,
        req.user.userId,
        custody.current_station,
        toStation.trim(),
        transferType,
        reason.trim()
      ]
    );

    /* 5️⃣ Update custody (authoritative state) */
    await client.query(
      `
      UPDATE evidence_custody
      SET
        current_station = $1,
        current_holder_id = $2,
        updated_at = NOW()
      WHERE evidence_id = $3
      `,
      [
        toStation.trim(),
        transferType === "INTERNAL" ? toUserId : null,
        evidenceId
      ]
    );

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   TRANSFER HISTORY (READ-ONLY LEDGER)
========================================================= */
router.get("/history/:evidenceId", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        t.id,
        t.from_station,
        t.to_station,
        t.transfer_type,
        t.remarks,
        t.created_at,
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
