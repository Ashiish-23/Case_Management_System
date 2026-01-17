const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* =========================================================
   INITIATE TRANSFER
========================================================= */
router.post("/initiate", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      evidenceId,
      caseId,
      toUserId,
      toStation,
      toExternalEntity,
      transferType,
      reason
    } = req.body;

    if (!evidenceId || !caseId || !transferType || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    /* 0️⃣ Block transfers for CLOSED / ARCHIVED cases */
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

    /* 3️⃣ Insert transfer event */
    const transfer = await client.query(
      `
      INSERT INTO evidence_transfers (
        evidence_id,
        case_id,
        from_user_id,
        from_station,
        to_user_id,
        to_station,
        to_external_entity,
        transfer_type,
        status,
        reason
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING',$9)
      RETURNING id
      `,
      [
        evidenceId,
        caseId,
        req.user.userId,
        custody.rows[0].storage_station,
        toUserId || null,
        toStation || null,
        toExternalEntity || null,
        transferType,
        reason
      ]
    );

    /* 4️⃣ Update custody */
    await client.query(
      `
      UPDATE evidence_custody
      SET custody_status = 'IN_TRANSFER',
          last_transfer_id = $1,
          updated_at = NOW()
      WHERE evidence_id = $2
      `,
      [transfer.rows[0].id, evidenceId]
    );

    await client.query("COMMIT");
    res.json({ success: true, transferId: transfer.rows[0].id });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Transfer initiation failed" });
  } finally {
    client.release();
  }
});

/* =========================================================
   GET MY PENDING TRANSFERS
========================================================= */
router.get("/pending", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

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
        c.case_title

      FROM evidence_transfers t
      JOIN evidence e ON e.id = t.evidence_id
      JOIN cases c ON c.id = t.case_id

      WHERE t.status = 'PENDING'
        AND t.to_user_id = $1

      ORDER BY t.created_at DESC
      `,
      [userId]
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
    const transferId = req.params.id;

    await client.query("BEGIN");

    const transfer = await client.query(
      `SELECT * FROM evidence_transfers
       WHERE id = $1 AND status = 'PENDING'
       FOR UPDATE`,
      [transferId]
    );

    if (!transfer.rows.length) {
      throw new Error("Transfer not found");
    }

    await client.query(
      `UPDATE evidence_transfers
       SET status = 'ACCEPTED'
       WHERE id = $1`,
      [transferId]
    );

    await client.query(
      `
      UPDATE evidence_custody
      SET current_holder_id = $1,
          storage_station = $2,
          custody_status = 'ACTIVE',
          updated_at = NOW()
      WHERE evidence_id = $3
      `,
      [
        req.user.userId,
        transfer.rows[0].to_station,
        transfer.rows[0].evidence_id
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

    const transfer = await client.query(
      `SELECT * FROM evidence_transfers
       WHERE id = $1 AND status = 'PENDING'
       FOR UPDATE`,
      [req.params.id]
    );

    if (!transfer.rows.length) {
      throw new Error("Transfer not found");
    }

    await client.query(
      `
      UPDATE evidence_transfers
      SET status = 'REJECTED',
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
      [transfer.rows[0].evidence_id]
    );

    await client.query(
      `
      INSERT INTO audit_log
      (entity_type, entity_id, action, severity, description, performed_by)
      VALUES
      ('EVIDENCE_TRANSFER', $1, 'REJECTED', 'HIGH', $2, $3)
      `,
      [req.params.id, rejectionReason, req.user.userId]
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

module.exports = router;
