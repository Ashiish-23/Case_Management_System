const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");
const { sendApprovalEmail } = require("../../services/emailService");
const { createAuditLog } = require("../../services/auditServices");

/* ======================================================
   GET USERS WITH PAGINATION + CURRENT STATION
====================================================== */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    /* TOTAL COUNT */
    const countResult = await pool.query(`SELECT COUNT(*) FROM users`);

    const total = parseInt(countResult.rows[0].count);

    /* FETCH USERS WITH CURRENT STATION */
    const result = await pool.query(
        `SELECT
          u.id,
          u.login_id,
          u.full_name,
          u.email,
          u.role,
          u.status,
          u.created_at,
          osa.station_name AS current_station,
          osa.assigned_at
        FROM users u
        LEFT JOIN officer_station_assignments osa
          ON osa.officer_id = u.id
          AND osa.relieved_at IS NULL
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      res.json({
        data: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
  }
  catch (err) {
    console.error("Users fetch error:", err.message);
    res.status(500).json({
      error: "Failed to fetch users"
    });
  }
});

/* ======================================================
   APPROVE USER + SEND EMAIL
====================================================== */
router.patch("/:id/approve", auth, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
        `UPDATE users
        SET status = 'active'
        WHERE id = $1
        AND role != 'admin'
        RETURNING email, full_name, login_id`,
        [req.params.id]
      );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "User not found or cannot approve admin"
      });
    }

    const user = result.rows[0];
    await client.query("COMMIT");

    await createAuditLog({
        actorUserId: req.user.userId,
        actorName: req.user.name,
        actionType: "USER_APPROVED",
        targetType: "USER",
        targetId: req.params.id,
        details: { email: user.email },
        ipAddress: req.ip
    });
    res.json({ success: true });

    /* SEND APPROVAL EMAIL */
    if (user.email) {
      try {
        await sendApprovalEmail(
          user.email,
          user.full_name,
          user.login_id
        );
      }
      catch (emailErr) {
        console.error("Approval email failed:", emailErr.message);
      }
    }
    res.json({
      success: true
    });
  }
  catch (err) {
    await client.query("ROLLBACK");
    console.error("Approve error:", err.message);
    res.status(500).json({
      error: "Failed to approve user"
    });
  }
  finally {
    client.release();
  }
});

/* ======================================================
   BLOCK USER
====================================================== */
router.patch("/:id/block", auth, requireAdmin, async (req, res) => {
  try {
    const result =
      await pool.query(
        `UPDATE users
        SET status = 'blocked'
        WHERE id = $1
        AND role != 'admin'`,
        [req.params.id]
      );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "User not found or cannot block admin"
      });
    }
    res.json({
      success: true
    });
  }
  catch (err) {
    console.error("Block error:", err.message);
    res.status(500).json({
      error: "Failed to block user"
    });
  }
});

/* ======================================================
   CHANGE ROLE
====================================================== */
router.patch("/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role)
      return res.status(400).json({
        error: "Role required"
      });

    const result = await pool.query(
        `UPDATE users
        SET role = $1
        WHERE id = $2
        AND role != 'admin'`,
        [role, req.params.id]
      );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "User not found or cannot modify admin"
      });
    }
    res.json({
      success: true
    });
  }
  catch (err) {
    console.error("Role update error:", err.message);
    res.status(500).json({
      error: "Failed to update role"
    });
}
});

/* ======================================================
   ASSIGN STATION (CHAIN-OF-CUSTODY SAFE)
====================================================== */
router.post("/:id/station", auth, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { station_name } = req.body;

    if (!station_name)
      return res.status(400).json({
        error: "Station name required"
      });

    await client.query("BEGIN");

    /* VALIDATE STATION EXISTS */
    const stationCheck = await client.query(
        `SELECT name
        FROM stations
        WHERE name = $1
        AND status = 'active'`,
        [station_name]
      );

    if (stationCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "Station does not exist"
      });
    }

    /* CLOSE OLD ASSIGNMENT */
    await client.query(
      `UPDATE officer_station_assignments
      SET relieved_at = now()
      WHERE officer_id = $1
      AND relieved_at IS NULL`,
      [req.params.id]
    );

    /* CREATE NEW ASSIGNMENT */
    await client.query(
      `INSERT INTO officer_station_assignments
      ( officer_id,
        station_name,
        assigned_by )
      VALUES ($1, $2, $3)`,
      [ req.params.id,
        station_name,
        req.user.userId ]
    );

    await client.query("COMMIT");
    res.json({
      success: true
    });
  }
  catch (err) {
    await client.query("ROLLBACK");
    console.error("Station assign error:", err.message);
    res.status(500).json({
      error: "Failed to assign station"
    });
  }
  finally {
    client.release();
  }
});

module.exports = router;
