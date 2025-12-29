const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("./auth"); // JWT verify (recommended)

router.get("/stats", auth, async (req, res) => {
  try {

    const totalCases = await pool.query(
      "SELECT COUNT(*) FROM cases"
    );

    const totalEvidence = await pool.query(
      "SELECT COUNT(*) FROM evidence"
    );

    const pendingTransfers = await pool.query(
      "SELECT COUNT(*) FROM evidence_movements WHERE status = 'PENDING'"
    );

    const violations = await pool.query(
      "SELECT COUNT(*) FROM chain_violations"
    );

    res.json({
      totalCases: totalCases.rows[0].count,
      totalEvidence: totalEvidence.rows[0].count,
      pendingTransfers: pendingTransfers.rows[0].count,
      violations: violations.rows[0].count
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
