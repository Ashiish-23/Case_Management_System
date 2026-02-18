const express = require("express");
const router = express.Router();
const pool = require("../../db");

/* ADMIN DASHBOARD STATS */
router.get("/", async (req, res) => {
  try {
    const users = await pool.query(`SELECT COUNT(*) FROM users`);

    const cases = await pool.query(`SELECT COUNT(*) FROM cases`);

    const evidence = await pool.query(`SELECT COUNT(*) FROM evidence`);

    const transfers = await pool.query(`SELECT COUNT(*) FROM evidence_transfers`);

    const stations =
      await pool.query(`
        SELECT COUNT(DISTINCT station_name)
        FROM cases
        WHERE station_name IS NOT NULL
      `);

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

module.exports = router;
