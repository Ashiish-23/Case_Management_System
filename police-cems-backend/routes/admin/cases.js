const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");

/* ======================================================
   GET ALL CASES (ADMIN VIEW WITH PAGINATION + SEARCH)
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
          c.case_number ILIKE $1 OR
          c.case_title ILIKE $1 OR
          c.station_name ILIKE $1 OR
          c.officer_name ILIKE $1
      `;
      values.push(`%${search}%`);
    }

    /* TOTAL COUNT */
    const countQuery = `
      SELECT COUNT(*)
      FROM cases c
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    /* FETCH CASE DATA */
    const dataQuery = `
      SELECT
        c.id,
        c.case_number,
        c.case_title,
        c.case_type,
        c.station_name,
        c.officer_name,
        c.registered_date,
        COUNT(e.id) AS evidence_count
      FROM cases c
      LEFT JOIN evidence e
        ON e.case_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const dataResult = await pool.query(dataQuery, values);

    res.json({
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  }
  catch (err) {
    console.error("Admin cases fetch error:", err.message);
    res.status(500).json({
      error: "Failed to fetch cases"
    });
  }
});

module.exports = router;
