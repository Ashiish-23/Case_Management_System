const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

/* ===============================
   ADMIN DASHBOARD STATS
================================ */
router.get("/stats", auth, requireAdmin, async (req, res) => {
  try {
    const users = await pool.query( `SELECT COUNT(*) FROM users` );

    const cases = await pool.query( `SELECT COUNT(*) FROM cases` );

    const evidence = await pool.query( `SELECT COUNT(*) FROM evidence` );

    res.json({
      totalUsers: Number(users.rows[0].count),
      totalCases: Number(cases.rows[0].count),
      totalEvidence: Number(evidence.rows[0].count)
    });
  }
  catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: "Failed to load admin stats"
    });
  }
});

module.exports = router;
