const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* =========================================================
   LIST CASES (WITH SEARCH + PAGINATION)
========================================================= */

router.get("/", auth, async (req, res) => {

  try {

    /* ================= QUERY PARAMS ================= */

    let page = Number(req.query.page);
    let limit = Number(req.query.limit);
    let search = req.query.search;

    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 25;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;

    /* ================= BASE QUERY ================= */

    let baseQuery = `
      SELECT 
        id,
        case_number,
        case_title,
        case_type,
        station_name,
        registered_date,
        created_at
      FROM cases
    `;

    const values = [];
    let whereClause = "";

    /* ================= SAFE SEARCH ================= */

    if (typeof search === "string") {

      search = search
        .trim()
        .normalize("NFKC")
        .substring(0, 100); // limit search size

      if (search.length >= 2) {

        values.push(`%${search}%`);

        whereClause = `
          WHERE
            case_number ILIKE $1 OR
            case_title ILIKE $1 OR
            case_type ILIKE $1 OR
            station_name ILIKE $1
        `;
      }
    }

    /* ================= FINAL QUERY ================= */

    const limitIndex = values.length + 1;
    const offsetIndex = values.length + 2;

    const finalQuery = `
      ${baseQuery}
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `;

    values.push(limit, offset);

    const result = await pool.query(finalQuery, values);

    res.json(result.rows);

  } catch (err) {

    console.error("Case list error:", err.message);

    res.status(500).json({
      error: "Failed to load cases"
    });
  }
});

module.exports = router;
