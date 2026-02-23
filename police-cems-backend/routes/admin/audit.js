const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");

/* ======================================================
   SYSTEM OVERVIEW
====================================================== */
router.get("/overview", auth, requireAdmin, async (req, res) => {
  try {
    const [officers, cases, evidence, transfers, stations] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM users"),
        pool.query("SELECT COUNT(*) FROM cases"),
        pool.query("SELECT COUNT(*) FROM evidence"),
        pool.query("SELECT COUNT(*) FROM evidence_transfers"),
        pool.query("SELECT COUNT(*) FROM stations WHERE status = 'active'")
      ]);

    res.json({
      officers: parseInt(officers.rows[0].count),
      cases: parseInt(cases.rows[0].count),
      evidence: parseInt(evidence.rows[0].count),
      transfers: parseInt(transfers.rows[0].count),
      stations: parseInt(stations.rows[0].count)
    });

  } catch (err) {
    console.error("Overview error:", err.message);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

/* ======================================================
   PAGINATED AUDIT LOGS
====================================================== */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    const countResult =
      await pool.query(`SELECT COUNT(*) FROM audit_logs`);
    const total =
      parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT *
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error("Audit fetch error:", err.message);
    res.status(500).json({
      error: "Failed to fetch audit logs"
    });
  }
});

module.exports = router;