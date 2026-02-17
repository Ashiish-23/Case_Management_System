const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

/* =====================================================
   ADMIN DASHBOARD STATS
===================================================== */
router.get("/stats", auth, requireAdmin, async (req, res) => {
  try {
    const users = await pool.query(`SELECT COUNT(*) FROM users`);

    const cases = await pool.query(`SELECT COUNT(*) FROM cases`);

    const evidence = await pool.query(`SELECT COUNT(*) FROM evidence`);

    const transfers = await pool.query(`SELECT COUNT(*) FROM evidence_transfers`);

    const stations =
      await pool.query(`
        SELECT COUNT(DISTINCT station_name)
        FROM cases
        WHERE station_name IS NOT NULL `);

    res.json({
      totalUsers: Number(users.rows[0].count),
      totalCases: Number(cases.rows[0].count),
      totalEvidence: Number(evidence.rows[0].count),
      totalTransfers: Number(transfers.rows[0].count),
      totalStations: Number(stations.rows[0].count)
    });
  }
  catch (err) {
    console.error("Admin stats error:", err.message);
    res.status(500).json({
      error: "Failed to load admin stats"
    });
  }
});

/* =====================================================
   GET ALL USERS
===================================================== */
router.get("/users", auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        login_id,
        full_name,
        email,
        role,
        status,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  }
  catch (err) {
    console.error("Admin users error:", err.message);
    res.status(500).json({
      error: "Failed to fetch users"
    });
  }
});

/* =====================================================
   APPROVE USER
===================================================== */
router.patch("/users/:id/approve", auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    await pool.query(
      `
      UPDATE users
      SET status = 'active'
      WHERE id = $1
      `,
      [userId]
    );
    res.json({ success: true });
  }
  catch (err) {
    console.error("Approve error:", err.message);
    res.status(500).json({
      error: "Failed to approve user"
    });
  }
});

/* =====================================================
   BLOCK USER
===================================================== */
router.patch("/users/:id/block", auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    await pool.query(
      `
      UPDATE users
      SET status = 'blocked'
      WHERE id = $1
      `,
      [userId]
    );
    res.json({ success: true });
  }
  catch (err) {
    console.error("Block error:", err.message);
    res.status(500).json({
      error: "Failed to block user"
    });
  }
});

/* =====================================================
   CHANGE USER ROLE
===================================================== */
router.patch("/users/:id/role", auth, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role)
      return res.status(400).json({
        error: "Role required"
      });

    await pool.query(
      `
      UPDATE users
      SET role = $1
      WHERE id = $2
      `,
      [role, userId]
    );
    res.json({ success: true });
  }
  catch (err) {
    console.error("Role update error:", err.message);
    res.status(500).json({
      error: "Failed to update role"
    });
  }
});

/* =====================================================
   GET ALL STATIONS
===================================================== */
router.get("/stations", auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT
        station_name AS id,
        station_name
      FROM cases
      WHERE station_name IS NOT NULL
      ORDER BY station_name `);
    res.json(result.rows);
  }
  catch (err) {
    console.error("Stations error:", err.message);
    res.status(500).json({
      error: "Failed to fetch stations"
    });
  }
});

/*=====================================================
   ADMIN CASE VIEW
===================================================== */
router.get("/cases", auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        case_number,
        case_title,
        case_type,
        station_name,
        registered_date
      FROM cases
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  }
  catch (err) {
    console.error("Admin cases error:", err.message);
    res.status(500).json({
      error: "Failed to fetch cases"
    });
  }
});

module.exports = router;
