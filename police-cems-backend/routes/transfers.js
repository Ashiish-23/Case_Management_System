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
      transferType,
      toOfficerLoginId,
      toStation,
      toExternalEntity,
      reason
    } = req.body;

    if (!evidenceId || !caseId || !transferType || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    /* 1️⃣ Validate case */
    const caseRes = await client.query(
      "SELECT status FROM cases WHERE id = $1",
      [caseId]
    );

    if (!caseRes.rows.length) {
      throw new Error("Case not found");
    }

    if (["CLOSED", "ARCHIVED"].includes(caseRes.rows[0].status)) {
      throw new Error("Transfers not allowed for closed or archived cases");
    }

    /* 2️⃣ Validate evidence */
    const evRes = await client.query(
      "SELECT id FROM evidence WHERE id = $1 AND case_id = $2",
      [evidenceId, caseId]
    );

    if (!evRes.rows.length) {
      throw new Error("Evidence does not belong to case");
    }

    /* 3️⃣ Lock custody */
    const custodyRes = await client.query(
      `SELECT * FROM evidence_custody
       WHERE evidence_id = $1
       FOR UPDATE`,
      [evidenceId]
    );

    if (!custodyRes.rows.length) {
      throw new Error("Custody record not found");
    }

    if (custodyRes.rows[0].custody_status === "IN_TRANSFER") {
      throw new Error("Evidence already in transfer");
    }

    /* 4️⃣ Resolve destination officer (Officer → Officer) */
    let toUserId = null;

    if (transferType === "PERSON_TO_PERSON") {
      if (!toOfficerLoginId) {
        throw new Error("Receiving officer login ID required");
      }

      const userRes = await client.query(
        "SELECT id FROM users WHERE login_id = $1",
        [toOfficerLoginId.trim()]
      );

      if (!userRes.rows.length) {
        throw new Error("Receiving officer not found");
      }

      toUserId = userRes.rows[0].id;
    }

    /* 5️⃣ Validate other transfer types */
    if (transferType === "PERSON_TO_STORAGE" && !toStation) {
      throw new Error("Storage location required");
    }

    if (transferType === "EXTERNAL_OUT" && !toExternalEntity) {
      throw new Error("External entity required");
    }

    /* 6️⃣ Insert transfer (ALWAYS PENDING) */
    const transferRes = await client.query(
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
        req.user.userId, // from JWT (UUID)
        custodyRes.rows[0].storage_station,
        toUserId,
        toStation || null,
        toExternalEntity || null,
        transferType,
        reason
      ]
    );

    /* 7️⃣ Update custody */
    await client.query(
      `
      UPDATE evidence_custody
      SET
        custody_status = 'IN_TRANSFER',
        last_transfer_id = $1,
        updated_at = NOW()
      WHERE evidence_id = $2
      `,
      [transferRes.rows[0].id, evidenceId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      transferId: transferRes.rows[0].id
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   GET MY PENDING TRANSFERS
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

        c.id AS case_id,
        c.case_number

      FROM evidence_transfers t
      JOIN evidence e ON e.id = t.evidence_id
      JOIN cases c ON c.id = t.case_id

      WHERE t.status = 'PENDING'
        AND t.to_user_id = $1

      ORDER BY t.created_at DESC
      `,
      [req.user.userId]
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

    const tRes = await client.query(
      `
      SELECT * FROM evidence_transfers
      WHERE id = $1 AND status = 'PENDING'
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!tRes.rows.length) {
      throw new Error("Transfer not found");
    }

    const transfer = tRes.rows[0];

    if (transfer.to_user_id !== req.user.userId) {
      throw new Error("Unauthorized");
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
        custody_status = 'ACTIVE',
        updated_at = NOW()
      WHERE evidence_id = $2
      `,
      [req.user.userId, transfer.evidence_id]
    );

    await client.query("COMMIT");
    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
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
    if (!rejectionReason) throw new Error("Rejection reason required");

    await client.query("BEGIN");

    const tRes = await client.query(
      `
      SELECT * FROM evidence_transfers
      WHERE id = $1 AND status = 'PENDING'
      FOR UPDATE
      `,
      [req.params.id]
    );

    if (!tRes.rows.length) {
      throw new Error("Transfer not found");
    }

    const transfer = tRes.rows[0];

    if (transfer.to_user_id !== req.user.userId) {
      throw new Error("Unauthorized");
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
      SET
        custody_status = 'ACTIVE',
        updated_at = NOW()
      WHERE evidence_id = $1
      `,
      [transfer.evidence_id]
    );

    await client.query("COMMIT");
    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

/* =========================================================
   TRANSFER HISTORY (READ-ONLY)
   Query by caseId or evidenceId
========================================================= */
router.get("/history", auth, async (req, res) => {
  try {
    const { caseId, evidenceId } = req.query;

    if (!caseId && !evidenceId) {
      return res.status(400).json({
        error: "caseId or evidenceId is required"
      });
    }

    const params = [];
    let whereClause = "";

    if (caseId) {
      params.push(caseId);
      whereClause = "t.case_id = $1";
    }

    if (evidenceId) {
      params.push(evidenceId);
      whereClause = "t.evidence_id = $1";
    }

    const result = await pool.query(
      `
      SELECT
        t.id,
        t.transfer_type,
        t.status,
        t.reason,
        t.created_at,

        e.id           AS evidence_id,
        e.evidence_code,

        c.id           AS case_id,
        c.case_number,

        fu.login_id    AS from_officer,
        tu.login_id    AS to_officer,

        t.to_station,
        t.to_external_entity

      FROM evidence_transfers t
      JOIN evidence e ON e.id = t.evidence_id
      JOIN cases c ON c.id = t.case_id
      LEFT JOIN users fu ON fu.id = t.from_user_id
      LEFT JOIN users tu ON tu.id = t.to_user_id

      WHERE ${whereClause}
      ORDER BY t.created_at ASC
      `,
      params
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Transfer history error:", err);
    res.status(500).json({
      error: "Failed to load transfer history"
    });
  }
});

module.exports = router;
