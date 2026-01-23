const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* =========================================================
   INITIATE TRANSFER
   Officer → Officer / Storage / External
========================================================= */
router.post("/initiate", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      evidenceId,
      caseId,
      toOfficerId,        // 🔑 HUMAN INPUT (login ID)
      toStation,
      toExternalEntity,
      transferType,
      reason
    } = req.body;

    if (!evidenceId || !caseId || !transferType || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    /* 0️⃣ Block CLOSED / ARCHIVED cases */
    const caseStatus = await client.query(
      "SELECT status FROM cases WHERE id = $1",
      [caseId]
    );

    if (!caseStatus.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Case not found" });
    }

    if (["CLOSED", "ARCHIVED"].includes(caseStatus.rows[0].status)) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "Transfers are not allowed for closed or archived cases"
      });
    }

    /* 1️⃣ Validate evidence belongs to case */
    const evidenceCheck = await client.query(
      "SELECT id FROM evidence WHERE id = $1 AND case_id = $2",
      [evidenceId, caseId]
    );

    if (!evidenceCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Evidence does not belong to case" });
    }

    /* 2️⃣ Lock custody row */
    const custody = await client.query(
      `SELECT * FROM evidence_custody
       WHERE evidence_id = $1
       FOR UPDATE`,
      [evidenceId]
    );

    if (!custody.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Custody record not found" });
    }

    if (custody.rows[0].custody_status === "IN_TRANSFER") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Evidence already in transfer" });
    }

    /* 3️⃣ Resolve destination officer (if needed) */
    let toUserId = null;

    if (transferType === "PERSON_TO_PERSON") {
      if (!toOfficerId) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Receiving officer ID required" });
      }

      const officer = await client.query(
        "SELECT id FROM users WHERE officer_id = $1",
        [toOfficerId]
      );

      if (!officer.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Receiving officer not found" });
      }

      toUserId = officer.rows[0].id; // 🔐 internal UUID
    }

    const isExternal = transferType === "EXTERNAL_OUT";

    /* 4️⃣ Insert transfer event */
    const transfer = await client.query(
      `
      INSERT INTO evidence_transfers (
        evidence_id,
        case_id,

        from_user_id,
        from_officer_id,
        from_station,

        to_user_id,
        to_officer_id,
        to_station,
        to_external_entity,

        transfer_type,
        status,
        reason
      )
      VALUES (
        $1,$2,
        $3,$4,$5,
        $6,$7,$8,$9,
        $10,$11,$12
      )
      RETURNING id
      `,
      [
        evidenceId,
        caseId,

        req.user.userId,           // UUID
        req.user.officerId,        // LOGIN ID
        custody.rows[0].storage_station,

        toUserId,
        toOfficerId || null,
        toStation || null,
        toExternalEntity || null,

        transferType,
        isExternal ? "COMPLETED_EXTERNAL" : "PENDING",
        reason
      ]
    );

    /* 5️⃣ Update custody */
    await client.query(
      `
      UPDATE evidence_custody
      SET
        custody_status = $1,
        last_transfer_id = $2,
        updated_at = NOW()
      WHERE evidence_id = $3
      `,
      [
        isExternal ? "CHECKED_OUT_EXTERNAL" : "IN_TRANSFER",
        transfer.rows[0].id,
        evidenceId
      ]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      transferId: transfer.rows[0].id
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Transfer initiation failed" });
  } finally {
    client.release();
  }
});

/* =========================================================
   GET MY PENDING TRANSFERS (INTERNAL)
========================================================= */
router.get("/pending", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
      t.id AS transfer_id,
      t.transfer_type,
      t.reason,
      t.created_at,

      e.id AS evidence_id,
      e.evidence_code,
      e.description,

      c.id AS case_id,
      c.case_number,
      c.case_title,

      u.full_name AS from_officer_name,
      t.from_station

      FROM evidence_transfers t
      JOIN evidence e ON e.id = t.evidence_id
      JOIN cases c ON c.id = t.case_id
      JOIN users u ON u.id = t.from_user_id

      WHERE t.status = 'PENDING'
      AND t.to_user_id = $1

      ORDER BY t.created_at DESC;
      `,
      [req.user.userId]   // 🔐 UUID check
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load pending transfers" });
  }
});

/* =========================================================
   ACCEPT TRANSFER
========================================================= */
router.post("/:id/accept", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const transferResult = await client.query(
      `
      SELECT *
      FROM evidence_transfers
      WHERE id = $1
        AND status = 'PENDING'
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!transferResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transfer not found" });
    }

    const transfer = transferResult.rows[0];

    /* STRICT authorization */
    if (transfer.to_user_id !== req.user.userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Unauthorized transfer" });
    }

    await client.query(
      `UPDATE evidence_transfers SET status = 'ACCEPTED' WHERE id = $1`,
      [req.params.id]
    );

    await client.query(
      `
      UPDATE evidence_custody
      SET
        current_holder_id = $1,
        storage_station = $2,
        custody_status = 'ACTIVE',
        updated_at = NOW()
      WHERE evidence_id = $3
      `,
      [
        req.user.userId,
        transfer.to_station,
        transfer.evidence_id
      ]
    );

    await client.query("COMMIT");
    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Accept transfer failed" });
  } finally {
    client.release();
  }
});

/* =========================================================
   REJECT TRANSFER
========================================================= */
router.post("/:id/reject", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: "Rejection reason required" });
    }

    await client.query("BEGIN");

    const transferResult = await client.query(
      `
      SELECT *
      FROM evidence_transfers
      WHERE id = $1
        AND status = 'PENDING'
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!transferResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transfer not found" });
    }

    const transfer = transferResult.rows[0];

    if (transfer.to_user_id !== req.user.userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Unauthorized transfer" });
    }

    await client.query(
      `
      UPDATE evidence_transfers
      SET
        status = 'REJECTED',
        rejection_reason = $1,
        rejected_by = $2,
        rejected_at = NOW()
      WHERE id = $3
      `,
      [rejectionReason, req.user.userId, req.params.id]
    );

    await client.query(
      `
      UPDATE evidence_custody
      SET custody_status = 'ACTIVE',
          updated_at = NOW()
      WHERE evidence_id = $1
      `,
      [transfer.evidence_id]
    );

    await client.query("COMMIT");
    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Reject transfer failed" });
  } finally {
    client.release();
  }
});

module.exports = router;
