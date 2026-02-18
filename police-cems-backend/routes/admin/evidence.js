const express = require("express");
const router = express.Router();
const pool = require("../../db");
const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");

/* ======================================================
   GET ALL EVIDENCE (ADMIN GLOBAL VIEW)
   PAGINATION + SEARCH + CASE + OFFICER + STATION
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
          e.description ILIKE $1 OR
          c.case_number ILIKE $1 OR
          c.station_name ILIKE $1 OR
          e.officer_name ILIKE $1 `;
      values.push(`%${search}%`);
    }

    /* COUNT */
    const countQuery = `
      SELECT COUNT(*)
      FROM evidence e
      LEFT JOIN cases c ON c.id = e.case_id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    /* DATA QUERY */
    const dataQuery = `
      SELECT
        e.id,
        e.evidence_code,
        e.description,
        e.category,
        e.current_station,
        e.officer_name,
        e.logged_at,
        c.case_number,
        c.case_title
      FROM evidence e
      LEFT JOIN cases c
        ON c.id = e.case_id
      ${whereClause}
      ORDER BY e.logged_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2} `;
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
    console.error("Admin evidence fetch error:", err.message);
    res.status(500).json({
      error: "Failed to fetch evidence"
    });
  }
});

module.exports = router;
