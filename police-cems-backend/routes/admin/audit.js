const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");

router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM audit_logs`);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
        `SELECT * FROM audit_logs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2 `,
        [limit, offset]
      );
    res.json({
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  }
  catch (err) {
    console.error("Audit fetch error:", err.message);
    res.status(500).json({
      error: "Failed to fetch audit logs"
    });
  }
});

module.exports = router;
