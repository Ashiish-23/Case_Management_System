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
        (SELECT COUNT(*) FROM evidence_transfers) AS transfers
    `);

    const row = result.rows[0];

    res.json({
      totalCases: Number(row.total_cases),
      openCases: Number(row.open_cases),
      reopenedCases: Number(row.reopened_cases),
      closedCases: Number(row.closed_cases),
      evidenceItems: Number(row.evidence_items),
      transfers: Number(row.transfers) || 0,
      chainViolations: 0   // <-- intentional placeholder
    });

  } catch (err) {
    console.error("Dashboard stats error:", err.message);
    res.status(500).json({ error: "Dashboard stats failed" });
  }
});

module.exports = router;
