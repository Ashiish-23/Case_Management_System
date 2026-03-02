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

  try {
    const {
      evidenceId,
      toStation,
      toOfficerId,
      toOfficerEmail,
      reason
    } = req.body;

    if (
      !evidenceId ||
      !toStation ||
      !toOfficerId ||
      !toOfficerEmail ||
      !reason
    ) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    if (reason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({
        error: `Reason too long (max ${MAX_REASON_LENGTH} chars)`
      });
    }

    const toStationTrim = toStation.trim();

    /* ---------- CHECK STATION EXISTS & ACTIVE ---------- */
    const stationCheck = await client.query(
      `SELECT status FROM stations WHERE name = $1`,
      [toStationTrim]
    );

    if (!stationCheck.rows.length) {
      return res.status(404).json({ error: "Station not found" });
    }

    if (stationCheck.rows[0].status !== "active") {
      return res.status(403).json({ error: "Station is disabled" });
    }

    await client.query("BEGIN");

    /* ---------- FETCH EVIDENCE ---------- */
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
    const caseNumber = evRes.rows[0].case_number;
    const evidenceCode = evRes.rows[0].evidence_code;

    /* ---------- LOCK CUSTODY ---------- */
    const custodyRes = await client.query(
      `SELECT * FROM evidence_custody WHERE evidence_id = $1 FOR UPDATE`,
      [evidenceId]
    );

    if (!custodyRes.rows.length) {
      throw new Error("CUSTODY_NOT_FOUND");
    }

    const custody = custodyRes.rows[0];

    if (custody.current_holder_id !== req.user.userId) {
      throw new Error("NOT_CUSTODY_HOLDER");
    }

    /* ---------- FIND RECEIVING OFFICER ---------- */
    const officerRes = await client.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(TRIM(login_id)) = LOWER(TRIM($1))
      AND LOWER(TRIM(email)) = LOWER(TRIM($2))
      `,
      [toOfficerId.trim(), toOfficerEmail.trim()]
    );

    if (!officerRes.rows.length) {
      throw new Error("OFFICER_NOT_FOUND");
    }

    const toUserId = officerRes.rows[0].id;

    if (custody.current_holder_id === toUserId) {
      throw new Error("SAME_OFFICER_TRANSFER");
    }

    if (
      custody.current_station.trim().toLowerCase() ===
      toStationTrim.toLowerCase()
    ) {
      throw new Error("SAME_STATION_TRANSFER");
    }

    /* ---------- INSERT TRANSFER ---------- */
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,'TRANSFER',$8,CURRENT_DATE,NOW())
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

    /* ---------- EMAIL (SIDE EFFECT) ---------- */
    try {
      await sendEventEmail({
        eventType: "EVIDENCE_TRANSFERRED",
        data: {
          email: toOfficerEmail,
          evidenceCode,
          caseNumber,
          fromStation: custody.current_station,
          toStation: toStationTrim
        },
        db: pool
      });
    } catch (err) {
      console.error("Transfer email failed:", err.message);
    }

    return res.json({
      success: true,
      transferId: transferRes.rows[0].id
    });

  } catch (err) {
    await client.query("ROLLBACK");

    if (err.message === "NOT_CUSTODY_HOLDER") {
      return res.status(403).json({ error: "You are not custody holder" });
    }

    if (err.message === "SAME_OFFICER_TRANSFER") {
      return res.status(400).json({ error: "Cannot transfer to same officer" });
    }

    if (err.message === "SAME_STATION_TRANSFER") {
      return res.status(400).json({ error: "Cannot transfer to same station" });
    }

    if (err.message === "EVIDENCE_NOT_FOUND") {
      return res.status(404).json({ error: "Evidence not found" });
    }

    if (err.message === "CUSTODY_NOT_FOUND") {
      return res.status(404).json({ error: "Custody record missing" });
    }

    if (err.message === "OFFICER_NOT_FOUND") {
      return res.status(404).json({ error: "Receiving officer not found" });
    }

    console.error("TRANSFER ERROR:", err.message);
    return res.status(500).json({ error: "Transfer failed" });

  } finally {
    client.release();
  }
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
