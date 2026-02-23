const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");
const { sendEventEmail } = require("../../services/emailService");
const { createAuditLog } = require("../../services/auditServices");

/* ======================================================
   GET USERS
   PAGINATION + SEARCH + CURRENT STATION
====================================================== */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    const search = req.query.search?.trim() || "";

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    let whereClause = "";
    let values = [];

    if (search.length >= 2) {
      whereClause = `
        WHERE
          u.full_name ILIKE $1 OR
          u.login_id ILIKE $1 OR
          u.email ILIKE $1
      `;
      values.push(`%${search}%`);
    }

    /* COUNT */
    const countQuery = `
      SELECT COUNT(*)
      FROM users u
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    /* DATA */
    const dataQuery = `
      SELECT
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
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    values.push(limit, offset);

    const result = await pool.query(dataQuery, values);

    res.json({
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error("Users fetch error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/* ======================================================
   APPROVE USER
====================================================== */
router.patch("/:id/approve", auth, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(`
      UPDATE users
      SET status = 'approved'
      WHERE id = $1
      AND role != 'admin'
      AND status != 'approved'
      RETURNING id, full_name, email, login_id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "User not found or already approved"
      });
    }

    const user = result.rows[0];

    /* Audit Log */
    await createAuditLog({
      actorUserId: req.user.userId,
      actorName: req.user.name,
      actionType: "USER_APPROVED",
      targetType: "USER",
      targetId: user.id,
      details: {
        loginId: user.login_id,
        email: user.email
      },
      ipAddress: req.ip
    });

    await client.query("COMMIT");

    /* Immediate success response */
    res.json({ success: true });

    /* Send email asynchronously */
    sendEventEmail({
      eventType: "USER_APPROVED",
      data: {
        email: user.email,
        fullName: user.full_name,
        loginId: user.login_id,
        userId: user.id
      },
      db: pool
    }).catch(err =>
      console.error("Approval email failed:", err.message)
    );

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Approve error:", err);
    res.status(500).json({ error: "Approval failed" });
  } finally {
    client.release();
  }
});

/* ======================================================
   BLOCK USER
====================================================== */
router.patch("/:id/block", auth, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(`
      UPDATE users
      SET status = 'blocked'
      WHERE id = $1
      AND role != 'admin'
      AND status != 'blocked'
      RETURNING id, full_name, email, login_id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        error: "User not found or already blocked"
      });
    }

    const user = result.rows[0];

    /* Audit Log */
    await createAuditLog({
      actorUserId: req.user.userId,
      actorName: req.user.name,
      actionType: "USER_BLOCKED",
      targetType: "USER",
      targetId: user.id,
      details: {
        loginId: user.login_id,
        email: user.email
      },
      ipAddress: req.ip
    });

    await client.query("COMMIT");

    res.json({ success: true });

    /* Send email async */
    sendEventEmail({
      eventType: "USER_BLOCKED",
      data: {
        email: user.email,
        fullName: user.full_name,
        loginId: user.login_id,
        userId: user.id
      },
      db: pool
    }).catch(err =>
      console.error("Block email failed:", err.message)
    );

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Block error:", err);
    res.status(500).json({ error: "Block failed" });
  } finally {
    client.release();
  }
});

/* ======================================================
   CHANGE ROLE
====================================================== */
router.patch("/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: "Role required" });
    }

    const result = await pool.query(`
      UPDATE users
      SET role = $1
      WHERE id = $2
      AND role != 'admin'
      RETURNING id
    `, [role, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ error: "Role update failed" });
  }
});

/* ======================================================
   ASSIGN STATION
====================================================== */
router.post("/:id/station", auth, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    const { station_name } = req.body;

    if (!station_name) {
      return res.status(400).json({ error: "Station required" });
    }

    await client.query("BEGIN");

    /* Validate station */
    const stationCheck = await client.query(`
      SELECT name
      FROM stations
      WHERE name = $1
      AND status = 'active'
    `, [station_name]);

    if (stationCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Station not found" });
    }

    /* Close old assignment */
    await client.query(`
      UPDATE officer_station_assignments
      SET relieved_at = NOW()
      WHERE officer_id = $1
      AND relieved_at IS NULL
    `, [req.params.id]);

    /* Insert new assignment */
    await client.query(`
      INSERT INTO officer_station_assignments (
        officer_id,
        station_name,
        assigned_by
      )
      VALUES ($1,$2,$3)
    `, [
      req.params.id,
      station_name,
      req.user.userId
    ]);

    await client.query("COMMIT");

    res.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Assign station error:", err);
    res.status(500).json({ error: "Station assignment failed" });
  } finally {
    client.release();
  }
});

module.exports = router;