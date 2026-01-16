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

    const fromUserId = req.user.userId;

    if (!evidenceId || !caseId || !transferType || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Destination validation
    if (
      (transferType === "PERSON_TO_PERSON" && !toUserId) ||
      (transferType === "PERSON_TO_STORAGE" && !toStation) ||
      (transferType === "EXTERNAL_OUT" && !toExternalEntity)
    ) {
      return res.status(400).json({ error: "Invalid transfer destination" });
    }

    await client.query("BEGIN");

    // Verify evidence belongs to case
    const evidenceCheck = await client.query(
      "SELECT id FROM evidence WHERE id = $1 AND case_id = $2",
      [evidenceId, caseId]
    );

    if (!evidenceCheck.rows.length) {
      throw new Error("Evidence does not belong to case");
    }

    // Lock custody row
    const custody = await client.query(
      `SELECT * FROM evidence_custody
       WHERE evidence_id = $1
       FOR UPDATE`,
      [evidenceId]
    );

    if (!custody.rows.length) {
      throw new Error("Custody record not found");
    }

    if (custody.rows[0].custody_status === "IN_TRANSFER") {
      throw new Error("Evidence already in transfer");
    }

    // Insert transfer
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
        fromUserId,
        custody.rows[0].storage_station,
        toUserId || null,
        toStation || null,
        toExternalEntity || null,
        transferType,
        reason
      ]
    );

    // Update custody
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
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ❌ Block transfers for closed / archived cases
const caseCheck = await client.query(
  "SELECT status FROM cases WHERE id = $1",
  [caseId]
);

if (!caseCheck.rows.length) {
  return res.status(404).json({ error: "Case not found" });
}

if (["CLOSED", "ARCHIVED"].includes(caseCheck.rows[0].status)) {
  return res.status(403).json({
    error: "Transfers are not allowed for closed or archived cases"
  });
}

/* =========================================================
   ACCEPT TRANSFER
========================================================= */
router.post("/:id/accept", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const transferId = req.params.id;
    const receiverId = req.user.userId;

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
        receiverId,
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
   GET MY PENDING TRANSFERS
========================================================= */
router.get("/pending", auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT 
        t.id AS transfer_id,
        t.evidence_id,
        e.evidence_code,
        e.description,
        c.case_number,
        t.from_station,
        t.reason,
        t.created_at
      FROM evidence_transfers t
      JOIN evidence e ON e.id = t.evidence_id
      JOIN cases c ON c.id = t.case_id
      WHERE t.to_user_id = $1
        AND t.status = 'PENDING'
      ORDER BY t.created_at DESC
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load pending transfers" });
  }
});

/* =========================================================
   GET PENDING TRANSFERS FOR LOGGED-IN OFFICER
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
   REJECT TRANSFER (BOUNCE BACK)
========================================================= */
router.post("/:id/reject", auth, async (req, res) => {
  const client = await pool.connect();

  try {
    const transferId = req.params.id;
    const { rejectionReason } = req.body;
    const userId = req.user.userId;

    if (!rejectionReason) {
      return res.status(400).json({ error: "Rejection reason required" });
    }

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
      `
      UPDATE evidence_transfers
      SET status = 'REJECTED',
          rejection_reason = $1,
          rejected_by = $2,
          rejected_at = NOW()
      WHERE id = $3
      `,
      [rejectionReason, userId, transferId]
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
      [transferId, rejectionReason, userId]
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
