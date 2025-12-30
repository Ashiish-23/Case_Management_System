const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

router.get("/stats", auth, async (req, res) => {
  try {

    const totalCases = await pool.query(`
      SELECT COUNT(*) FROM cases
    `);

    const totalEvidence = await pool.query(`
      SELECT COUNT(*) FROM evidence
    `);

    const pendingTransfers = await pool.query(`
      SELECT COUNT(*) FROM transfers
      WHERE status = 'PENDING'
    `);

    const violations = await pool.query(`
      SELECT COUNT(*) FROM audit_log
      WHERE action = 'CHAIN_BREACH'
    `);

    return res.json({
      totalCases: Number(totalCases.rows[0].count),
      totalEvidence: Number(totalEvidence.rows[0].count),
      pendingTransfers: Number(pendingTransfers.rows[0].count),
      violations: Number(violations.rows[0].count)
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
