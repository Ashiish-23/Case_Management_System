const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");

/* =====================================================
   GET ALL STATIONS WITH PAGINATION
===================================================== */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM stations
    `);

    const total = Number(countResult.rows[0].count);
    const result = await pool.query(`
      SELECT
        s.name,
        s.status,
        s.created_at,
        (
          SELECT COUNT(*)
          FROM officer_station_assignments osa
          WHERE osa.station_name = s.name
          AND osa.relieved_at IS NULL
        ) AS officer_count,

        (
          SELECT COUNT(*)
          FROM cases c
          WHERE c.station_name = s.name
        ) AS case_count
      FROM stations s
      ORDER BY s.name
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json({
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  }
  catch (err) {
    console.error("Stations fetch error:", err.message);
    res.status(500).json({
      error: "Failed to fetch stations"
    });
  }
});

/* =====================================================
   CREATE STATION
===================================================== */
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.length < 3)
      return res.status(400).json({
        error: "Valid station name required"
      });

    await pool.query(`
      INSERT INTO stations (name, status)
      VALUES ($1, 'active')
    `, [name]);

    res.json({ success: true });

  }
  catch (err) {

    if (err.code === "23505")
      return res.status(400).json({
        error: "Station already exists"
      });

    console.error("Create station error:", err.message);
    res.status(500).json({
      error: "Failed to create station"
    });
  }
});

/* =====================================================
   ACTIVATE / DEACTIVATE STATION
===================================================== */
router.patch("/:name/status", auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status))
      return res.status(400).json({
        error: "Invalid status"
      });

    await pool.query(`
      UPDATE stations
      SET status = $1
      WHERE name = $2
    `, [status, req.params.name]);

    res.json({ success: true });
  }
  catch (err) {
    console.error("Status update error:", err.message);
    res.status(500).json({
      error: "Failed to update station"
    });
  }
});

/* =====================================================
   GET OFFICERS IN STATION
===================================================== */
router.get("/:name/officers", auth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.login_id,
        u.full_name,
        u.role
      FROM officer_station_assignments osa
      JOIN users u
      ON osa.officer_id = u.id
      WHERE osa.station_name = $1
      AND osa.relieved_at IS NULL
      ORDER BY u.full_name
    `, [req.params.name]);
    res.json(result.rows);
  }
  catch (err) {
    console.error("Station officers error:", err.message);
    res.status(500).json({
      error: "Failed to fetch officers"
    });
  }
});

module.exports = router;
