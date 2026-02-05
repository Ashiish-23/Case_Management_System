const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const { sendEventEmail } = require("../services/emailService");

/* =========================================================
   CREATE NEW TRANSFER (IMMEDIATE, TRUSTED)
========================================================= */
router.post("/create", auth, async (req, res) => {
  const client = await pool.connect();

  let transferId;
  let evidenceCode;
  let caseNumber;
  let fromStation;
  let toStationTrim;

  try {
    const {
      evidenceId,
      toStation,
      toOfficerId,
      toOfficerEmail,
      reason
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!evidenceId || !toStation || !reason || !toOfficerId || !toOfficerEmail) {
      return res.status(400).json({ error: "All fields are mandatory" });
    }

    toStationTrim = toStation.trim();

    /* ---------- TRANSACTION (AUTHORITATIVE) ---------- */
    await client.query("BEGIN");

    // 1️⃣ Verify evidence
    const evRes = await client.query(
      `
      SELECT
        e.id,
        e.case_id,
        e.evidence_code,
        c.case_number
      FROM evidence e
      JOIN cases c ON c.id = e.case_id
      WHERE e.id = $1
      `,
      [evidenceId]
    );

    if (!evRes.rows.length) {
      throw new Error("Evidence not found");
    }

    const caseId = evRes.rows[0].case_id;
    caseNumber = evRes.rows[0].case_number;
    evidenceCode = evRes.rows[0].evidence_code;

    // 2️⃣ Lock custody
    const custodyRes = await client.query(
      `SELECT * FROM evidence_custody WHERE evidence_id = $1 FOR UPDATE`,
      [evidenceId]
    );

    if (!custodyRes.rows.length) {
      throw new Error("Custody record not found");
    }

    const custody = custodyRes.rows[0];
    fromStation = custody.current_station;

    // 3️⃣ Resolve receiving officer
    const officerRes = await client.query(
      `SELECT id FROM users WHERE login_id = $1 AND email = $2`,
      [toOfficerId, toOfficerEmail]
    );

    if (!officerRes.rows.length) {
      throw new Error("Receiving officer not found or email mismatch");
    }

    const toUserId = officerRes.rows[0].id;

    // 🚫 Block no-op transfer
    if (
      custody.current_holder_id === toUserId &&
      custody.current_station === toStationTrim
    ) {
      throw new Error("Transfer must change officer or location");
    }

    // 4️⃣ Insert transfer (immutable ledger)
    const transferRes = await client.query(
      `
      INSERT INTO evidence_transfers (
        evidence_id,
        case_id,
        from_user_id,
        to_user_id,
        initiated_by,
        from_station,
        to_station,
        remarks,
        transfer_date,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE,NOW())
      RETURNING id
      `,
      [
        evidenceId,
        caseId,
        custody.current_holder_id,
        toUserId,
        req.user.userId,
        custody.current_station,
        toStationTrim,
        reason.trim()
      ]
    );

    transferId = transferRes.rows[0].id;

    // 5️⃣ Update custody (current truth)
    await client.query(
      `
      UPDATE evidence_custody
      SET
        current_station = $1,
        current_holder_id = $2,
        updated_at = NOW()
      WHERE evidence_id = $3
      `,
      [toStationTrim, toUserId, evidenceId]
    );

    await client.query("COMMIT");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("TRANSFER DB FAILED:", err.message);
    return res.status(500).json({ error: "Transfer failed" });
  } finally {
    client.release();
  }

  /* ---------- SIDE-EFFECT ZONE (EMAIL) ---------- */
  let emailResult = null;

  try {
    emailResult = await sendEventEmail({
      eventType: "EVIDENCE_TRANSFERRED",
      data: {
        email: req.body.toOfficerEmail,
        evidenceCode,
        caseNumber,
        transferId,
        fromStation,
        toStation: toStationTrim
      },
      db: pool
    });
  } catch (err) {
    console.error("Transfer email failed:", err.message);
  }

  /* ---------- FINAL RESPONSE (TRUTHFUL) ---------- */
  res.json({
    success: true,
    transferId,
    emailSent: emailResult?.ok ?? false
  });
});

/* =========================================================
   TRANSFER HISTORY (READ-ONLY LEDGER)
========================================================= */
router.get("/history/:evidenceId", auth, async (req, res) => {
  try {
    const { evidenceId } = req.params;

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.case_id,
        t.evidence_id,
        t.from_station,
        t.to_station,
        t.remarks,
        t.transfer_date,
        t.created_at,

        fu.full_name AS from_officer,
        tu.full_name AS to_officer,
        iu.full_name AS transferred_by

      FROM evidence_transfers t
      LEFT JOIN users fu ON fu.id = t.from_user_id
      LEFT JOIN users tu ON tu.id = t.to_user_id
      JOIN users iu ON iu.id = t.initiated_by

      WHERE t.evidence_id = $1
      ORDER BY t.created_at DESC
      `,
      [evidenceId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("TRANSFER HISTORY ERROR:", err.message);
    res.status(500).json({ error: "Failed to load transfer history" });
  }
});

module.exports = router;
