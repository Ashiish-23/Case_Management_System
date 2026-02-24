const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const { sendEventEmail } = require("../services/emailService");

/* ================= CONSTANTS ================= */
const MAX_REASON_LENGTH = 500;

/* ================= HELPERS ================= */
function normalizeString(str) {
  return str.trim().toLowerCase();
}

/* =========================================================
   CREATE NEW TRANSFER
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

    /* ---------- STRICT VALIDATION ---------- */
    if (
      !evidenceId ||
      typeof toStation !== "string" ||
      typeof reason !== "string" ||
      typeof toOfficerId !== "string" ||
      typeof toOfficerEmail !== "string"
    ) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    if (reason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({
        error: `Reason too long (max ${MAX_REASON_LENGTH} chars)`
      });
    }

    toStationTrim = toStation.trim();

    if (toStationTrim.length < 2 || toStationTrim.length > 100) {
      return res.status(400).json({ error: "Invalid station name" });
    }

    await client.query("BEGIN");

    /* ---------- VERIFY EVIDENCE ---------- */
    const evRes = await client.query(
      `
      SELECT e.id, e.case_id, e.evidence_code, c.case_number
      FROM evidence e
      JOIN cases c ON c.id = e.case_id
      WHERE e.id = $1
      `,
      [evidenceId]
    );

    if (!evRes.rows.length) {
      throw new Error("EVIDENCE_NOT_FOUND");
    }

    const caseId = evRes.rows[0].case_id;
    caseNumber = evRes.rows[0].case_number;
    evidenceCode = evRes.rows[0].evidence_code;

    /* ---------- LOCK CUSTODY ---------- */
    const custodyRes = await client.query( `SELECT * FROM evidence_custody WHERE evidence_id = $1 FOR UPDATE`, [evidenceId] );

    if (!custodyRes.rows.length) {
      throw new Error("CUSTODY_NOT_FOUND");
    }

    const custody = custodyRes.rows[0];
    fromStation = custody.current_station;

    /* ⭐ AUTHORIZATION: ONLY CURRENT HOLDER CAN TRANSFER */
    if (custody.current_holder_id !== req.user.userId) {
      throw new Error("NOT_CUSTODY_HOLDER");
    }

    /* ---------- RESOLVE RECEIVING OFFICER ---------- */
    const officerRes = await client.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(TRIM(login_id)) = LOWER(TRIM($1))
      AND LOWER(TRIM(email)) = LOWER(TRIM($2))
      `,
      [toOfficerId, toOfficerEmail]
    );

    if (!officerRes.rows.length) {
      throw new Error("OFFICER_NOT_FOUND");
    }

    const toUserId = officerRes.rows[0].id;

    /* ---------- NO-OP TRANSFER BLOCK ---------- */
    if (custody.current_holder_id === toUserId) {
      throw new Error("SAME_OFFICER_TRANSFER");
    }

    if ( normalizeString(custody.current_station) === normalizeString(toStationTrim)) {
      throw new Error("SAME_STATION_TRANSFER");
    }

    /* ---------- INSERT LEDGER ENTRY ---------- */
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
        transfer_type,
        remarks,
        transfer_date,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_DATE,NOW())
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
        "TRANSFER",
        reason.trim()
      ]
    );

    transferId = transferRes.rows[0].id;

    /* ---------- UPDATE CUSTODY ---------- */
    await client.query(
      `
      UPDATE evidence_custody
      SET current_station = $1,
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

    /* ⭐ SAFE ERROR MAPPING */
    if (err.message === "NOT_CUSTODY_HOLDER") {
      return res.status(403).json({ error: "You are not custody holder" });
    }

    if ( err.message === "SAME_OFFICER_TRANSFER" || err.message === "SAME_STATION_TRANSFER") {
      return res.status(400).json({ error: "Invalid transfer request" });
    }

    if ( err.message === "EVIDENCE_NOT_FOUND" || err.message === "CUSTODY_NOT_FOUND" ) {
      return res.status(404).json({ error: "Evidence record not found" });
    }

    return res.status(500).json({ error: "Transfer failed" });
  } finally {
    client.release();
  }

  const stationCheck = await pool.query( `SELECT status FROM stations WHERE name = $1`, [station_name] );
  if (stationCheck.rows.length === 0) {
    return res.status(404).json({ error: "Station not found" });
  }
  if (stationCheck.rows[0].status !== "active") {
    return res.status(403).json({ error: "Station is disabled" });
  }

  /* ---------- EMAIL SIDE EFFECT ---------- */
  try {
    await sendEventEmail({
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

  res.json({
    success: true,
    transferId
  });
});

/* =========================================================
   TRANSFER HISTORY
========================================================= */
router.get("/history/:evidenceId", auth, async (req, res) => {
  try {

    if (!req.params.evidenceId) {
      return res.status(400).json({ error: "Evidence ID required" });
    }

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
      [req.params.evidenceId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("TRANSFER HISTORY ERROR:", err.message);
    res.status(500).json({ error: "Failed to load transfer history" });
  }
});

module.exports = router;
