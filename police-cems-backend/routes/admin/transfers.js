const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");

/* ======================================================
   ADMIN VIEW — GLOBAL TRANSFER LEDGER
====================================================== */
router.get("/", auth, requireAdmin, async (req, res) => {
  try {

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || "";

    let whereClause = "";
    let values = [];

    if (search.length >= 2) {
      whereClause = `
        WHERE
          e.evidence_code ILIKE $1 OR
          c.case_number ILIKE $1 OR
          t.from_station ILIKE $1 OR
          t.to_station ILIKE $1 OR
          u.full_name ILIKE $1`;
      values.push(`%${search}%`);
    }

    /* ================= COUNT ================= */
    const countQuery = `
      SELECT COUNT(*)
      FROM evidence_transfers t
      JOIN evidence e
        ON e.id = t.evidence_id
      JOIN cases c
        ON c.id = e.case_id
      JOIN users u
        ON u.id = t.transferred_by
      ${whereClause}`;

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    /* ================= DATA ================= */
    const dataQuery = `
      SELECT
        t.id,
        t.transferred_at,
        t.from_station,
        t.to_station,
        e.evidence_code,
        c.case_number,
        u.full_name AS transferred_by
      FROM evidence_transfers t
      JOIN evidence e
        ON e.id = t.evidence_id
      JOIN cases c
        ON c.id = e.case_id
      JOIN users u
        ON u.id = t.transferred_by
      ${whereClause}
      ORDER BY t.transferred_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await pool.query(dataQuery, values);
    res.json({
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  }
  catch (err) {
    console.error("Admin transfers error:", err.message);
    res.status(500).json({
      error: "Failed to fetch transfers"
    });
  }
});

module.exports = router;
