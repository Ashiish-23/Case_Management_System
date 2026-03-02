const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

router.get("/search", auth, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (q.length < 2) {
      return res.json([]);
    }

    const result = await pool.query(`
      SELECT id, name, city, district
      FROM stations
      WHERE status = 'active'
      AND name ILIKE $1
      ORDER BY name ASC
      LIMIT 10
    `, [`%${q}%`]);

    res.json(result.rows);

  } catch (err) {
    console.error("Station search error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;