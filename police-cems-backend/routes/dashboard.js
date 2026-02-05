const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* =========================================================
   DASHBOARD STATS (LEDGER FACTS ONLY)
========================================================= */
router.get("/stats", auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM cases)                AS total_cases,
        (SELECT COUNT(*) FROM evidence)             AS total_evidence,
        (SELECT COUNT(*) FROM evidence_transfers)  AS total_transfers,
        (SELECT COUNT(*) FROM evidence_custody)    AS custody_records
    `);

    const row = result.rows[0];

    res.json({
      totalCases: Number(row.total_cases),
      evidenceItems: Number(row.total_evidence),
      transfers: Number(row.total_transfers),
      custodyRecords: Number(row.custody_records),
      chainViolations: 0 // reserved for future integrity checks
    });

  } catch (err) {
    console.error("Dashboard stats error:", err.message);
    res.status(500).json({ error: "Dashboard stats failed" });
  }
});

module.exports = router;
