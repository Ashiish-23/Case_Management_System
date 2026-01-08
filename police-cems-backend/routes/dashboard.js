const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

router.get("/stats", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM cases) AS total_cases,
        (SELECT COUNT(*) FROM cases WHERE status='OPEN') AS open_cases,
        (SELECT COUNT(*) FROM cases WHERE status='REOPENED') AS reopened_cases,
        (SELECT COUNT(*) FROM cases WHERE status='CLOSED') AS closed_cases,
        (SELECT COUNT(*) FROM evidence) AS evidence_items,
        (SELECT COUNT(*) FROM transfers) AS transfers,
        COALESCE((SELECT COUNT(*) FROM chain_violations), 0) AS chain_violations
    `);

    res.json({
      totalCases: Number(result.rows[0].total_cases),
      openCases: Number(result.rows[0].open_cases),
      reopenedCases: Number(result.rows[0].reopened_cases),
      closedCases: Number(result.rows[0].closed_cases),
      evidenceItems: Number(result.rows[0].evidence_items),
      transfers: Number(result.rows[0].transfers),
      chainViolations: Number(result.rows[0].chain_violations)
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Dashboard stats failed" });
  }
});

module.exports = router;
