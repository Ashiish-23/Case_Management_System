const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const crypto = require("crypto");
const { sendEventEmail } = require("../services/emailService");

/* ================= CONSTANTS ================= */
const MAX_REASON_LENGTH = 500;

/* ================= HASH HELPER ================= */
function generateHash(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
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

    if (!evidenceId || !toStation || !toOfficerId || !toOfficerEmail || !reason) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    if (reason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({
        error: `Reason too long (max ${MAX_REASON_LENGTH})`
      });
    }

    /* ---------- DESTINATION STATION ---------- */
    const stationRes = await client.query(
      `SELECT id, name, status FROM stations WHERE name = $1`,
      [toStation.trim()]
    );

    if (!stationRes.rows.length)
      return res.status(404).json({ error: "Station not found" });

    if (stationRes.rows[0].status !== "active")
      return res.status(403).json({ error: "Station disabled" });

    const toStationId = stationRes.rows[0].id;
    const toStationName = stationRes.rows[0].name;

    await client.query("BEGIN");

    /* ---------- FETCH EVIDENCE ---------- */
    const evRes = await client.query( ` SELECT e.id, e.case_id, e.evidence_code, c.case_number FROM evidence e
      JOIN cases c ON c.id = e.case_id WHERE e.id = $1 `, [evidenceId] );

    if (!evRes.rows.length)
      throw new Error("EVIDENCE_NOT_FOUND");

    const caseId = evRes.rows[0].case_id;
    const caseNumber = evRes.rows[0].case_number;
    const evidenceCode = evRes.rows[0].evidence_code;

    /* ---------- LOCK CUSTODY ---------- */
    const custodyRes = await client.query( `SELECT * FROM evidence_custody WHERE evidence_id = $1 FOR UPDATE`, [evidenceId] );

    if (!custodyRes.rows.length)
      throw new Error("CUSTODY_NOT_FOUND");

    const custody = custodyRes.rows[0];
    const evidenceStationId = custody.current_station_id;

    /* ---------- OFFICER STATION ---------- */
    const officerStationRes = await client.query( ` SELECT station_id FROM officer_station_assignments WHERE officer_id = $1
      AND relieved_at IS NULL `, [req.user.userId] );

    if (!officerStationRes.rows.length)
      throw new Error("OFFICER_STATION_NOT_ASSIGNED");

    const officerStationId = officerStationRes.rows[0].station_id;

    /* ---------- JURISDICTION CHECK ---------- */
    if (String(officerStationId) !== String(evidenceStationId)) {
      throw new Error("JURISDICTION_VIOLATION");
    }

    /* ---------- RECEIVING OFFICER ---------- */
    const officerRes = await client.query( ` SELECT id FROM users WHERE LOWER(TRIM(login_id)) = LOWER(TRIM($1))
      AND LOWER(TRIM(email)) = LOWER(TRIM($2)) `, [toOfficerId.trim(), toOfficerEmail.trim()] );

    if (!officerRes.rows.length)
      throw new Error("OFFICER_NOT_FOUND");

    const toUserId = officerRes.rows[0].id;

    if (toUserId === req.user.userId)
      throw new Error("SAME_OFFICER_TRANSFER");

    /* ---------- SAME STATION BLOCK ---------- */
    if (String(evidenceStationId) === String(toStationId))
      throw new Error("SAME_STATION_TRANSFER");

    /* ---------- PREVIOUS HASH ---------- */
    const prevHashRes = await client.query( ` SELECT current_hash FROM evidence_transfers WHERE evidence_id = $1
      ORDER BY created_at DESC LIMIT 1 `, [evidenceId] );

    const previousHash =
      prevHashRes.rows.length === 0
        ? "GENESIS"
        : prevHashRes.rows[0].current_hash;

    const createdAt = new Date().toISOString();

    /* ---------- HASH ---------- */
    const hashPayload = evidenceId + evidenceStationId + toStationId + req.user.userId + reason.trim() + createdAt + previousHash;
    const currentHash = generateHash(hashPayload);

    /* ---------- INSERT TRANSFER ---------- */
    const transferRes = await client.query( ` INSERT INTO evidence_transfers ( evidence_id, case_id, from_user_id, to_user_id,
        initiated_by, from_station, to_station, transfer_type, remarks, transfer_date, created_at, previous_hash, current_hash )
      VALUES ($1,$2,$3,$4,$5,$6,$7,'TRANSFER',$8,CURRENT_DATE,$9,$10,$11) RETURNING id `,
      [ evidenceId, caseId, req.user.userId, toUserId, req.user.userId, evidenceStationId, toStationId,
        reason.trim(), createdAt, previousHash, currentHash ]);

    /* ---------- UPDATE CUSTODY ---------- */
    await client.query( ` UPDATE evidence_custody SET current_station_id = $1, last_moved_by_user_id = $2,
          updated_at = NOW() WHERE evidence_id = $3 `, [toStationId, req.user.userId, evidenceId] );

    await client.query("COMMIT");

    /* ---------- EMAIL ---------- */
    try {
      await sendEventEmail({
  eventType: "EVIDENCE_TRANSFERRED",
  referenceId: evidenceId,
  data: {
    email: toOfficerEmail,
    evidenceCode,
    caseNumber,
    fromStation: evidenceStationId,
    toStation: toStationName
  },
  db: pool
});
    } catch (err) {
      console.error("Transfer email failed:", err.message);
    }

    res.json({
      success: true,
      transferId: transferRes.rows[0].id
    });
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.message === "JURISDICTION_VIOLATION")
      return res.status(403).json({
        error: "You cannot transfer evidence from another station"
      });

    if (err.message === "OFFICER_STATION_NOT_ASSIGNED")
      return res.status(403).json({
        error: "Officer has no station assignment"
      });

    if (err.message === "SAME_OFFICER_TRANSFER")
      return res.status(400).json({
        error: "Cannot transfer to same officer"
      });

    if (err.message === "SAME_STATION_TRANSFER")
      return res.status(400).json({
        error: "Cannot transfer to same station"
      });

    if (err.message === "OFFICER_NOT_FOUND")
      return res.status(404).json({
        error: "Receiving officer not found"
      });

    if (err.message === "EVIDENCE_NOT_FOUND")
      return res.status(404).json({
        error: "Evidence not found"
      });

    console.error("TRANSFER ERROR:", err.message);
    res.status(500).json({ error: "Transfer failed" });
  } finally {
    client.release();
  }
});

/* =========================================================
   TRANSFER HISTORY
========================================================= */
router.get("/history/:evidenceId", auth, async (req, res) => {
  try {
    const { evidenceId } = req.params;

    if (!evidenceId) {
      return res.status(400).json({ error: "Evidence ID required" });
    }

    const result = await pool.query(
`
SELECT
  t.id,
  t.case_id,
  t.evidence_id,

  fs.name AS from_station,
  ts.name AS to_station,

  t.remarks,
  t.transfer_date,
  t.created_at,

  fu.full_name AS from_officer,
  tu.full_name AS to_officer,
  iu.full_name AS transferred_by

FROM evidence_transfers t

LEFT JOIN stations fs ON fs.id = t.from_station::uuid
LEFT JOIN stations ts ON ts.id = t.to_station::uuid

LEFT JOIN users fu ON fu.id = t.from_user_id
LEFT JOIN users tu ON tu.id = t.to_user_id
LEFT JOIN users iu ON iu.id = t.initiated_by

WHERE t.evidence_id = $1::uuid
ORDER BY t.created_at DESC
`,
[evidenceId]
);

    // Always return an array, even if empty
    res.json(result.rows || []);
  } catch (err) {
    console.error("TRANSFER HISTORY ERROR:", err.message);
    res.status(500).json({ error: "Failed to load transfer history" });
  }
});

module.exports = router;