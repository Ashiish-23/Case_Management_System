const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");

/* ======================================================
   ADMIN — GLOBAL TRANSFER LEDGER
====================================================== */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    /* ================= PAGINATION ================= */
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || "";

    let whereClause = "";
    let values = [];

    /* ================= SEARCH ================= */
    if (search.length >= 2) {
      whereClause =`WHERE e.evidence_code ILIKE $1 OR c.case_number ILIKE $1 OR fs.name ILIKE $1 OR ts.name ILIKE $1 OR u.full_name ILIKE $1`;
      values.push(`%${search}%`);
    }

    /* ================= COUNT ================= */
    const countQuery = `SELECT COUNT(*) FROM evidence_transfers t LEFT JOIN evidence e ON e.id = t.evidence_id LEFT JOIN cases 
    c ON c.id = t.case_id LEFT JOIN users u ON u.id = t.initiated_by LEFT JOIN stations fs ON fs.id = t.from_station 
    LEFT JOIN stations ts ON ts.id = t.to_station ${whereClause} `;

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    /* ================= DATA QUERY ================= */
    const dataQuery = `SELECT t.id, e.evidence_code, c.case_number, fs.name AS from_station, ts.name AS to_station, 
    u.full_name AS transferred_by, t.created_at FROM evidence_transfers t LEFT JOIN evidence e ON e.id = t.evidence_id LEFT JOIN cases c
    ON c.id = t.case_id LEFT JOIN users u ON u.id = t.initiated_by LEFT JOIN stations fs ON fs.id = t.from_station LEFT JOIN stations ts 
    ON ts.id = t.to_station ${whereClause} ORDER BY t.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2} `;

    const result = await pool.query(dataQuery, [...values, limit, offset]);

    /* ================= RESPONSE ================= */
    res.json({ data: result.rows, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Admin transfers error:", err);
    res.status(500).json({
      error: "Failed to fetch transfers"
    });
  }
});

module.exports = router;