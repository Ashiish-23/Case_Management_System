const express = require("express");
const router = express.Router();

const pool = require("../../db");

const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");



/* =====================================================
   GET ALL STATIONS
   Admin global station ledger
===================================================== */

router.get("/", auth, requireAdmin, async (req, res) => {

  try {

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let search = req.query.search?.trim() || "";

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    /* ================= COUNT ================= */

    const countQuery = `
      SELECT COUNT(*)
      FROM stations s
      WHERE s.name ILIKE $1
    `;

    const countResult = await pool.query(countQuery, [`%${search}%`]);
    const total = parseInt(countResult.rows[0].count);


    /* ================= MAIN DATA ================= */

    const dataQuery = `

      SELECT

        s.id,
        s.name,
        s.code,
        s.city,
        s.district,
        s.state,
        s.status,
        s.created_at,
        s.updated_at,

        /* ACTIVE OFFICERS COUNT */

        (
          SELECT COUNT(*)
          FROM officer_station_assignments osa
          WHERE osa.station_name = s.name
          AND osa.relieved_at IS NULL
        ) AS officer_count,


        /* CASE COUNT */

        (
          SELECT COUNT(*)
          FROM cases c
          WHERE c.station_name = s.name
        ) AS case_count


      FROM stations s

      WHERE s.name ILIKE $1

      ORDER BY s.name ASC

      LIMIT $2 OFFSET $3

    `;

    const result = await pool.query(dataQuery, [
      `%${search}%`,
      limit,
      offset
    ]);


    res.json({

      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)

    });

  }
  catch (err) {

    console.error("Stations fetch error:", err);

    res.status(500).json({
      error: "Failed to fetch stations"
    });

  }

});



/* =====================================================
   AUTOCOMPLETE SEARCH (Transfers / assignment)
===================================================== */

router.get("/search", auth, async (req, res) => {

  try {

    const q = req.query.q?.trim() || "";

    if (q.length < 1)
      return res.json([]);

    const result = await pool.query(`

      SELECT
        id,
        name,
        city,
        district

      FROM stations

      WHERE
        status = 'active'
        AND name ILIKE $1

      ORDER BY name
      LIMIT 10

    `, [`${q}%`]);


    res.json(result.rows);

  }
  catch (err) {

    console.error("Station search error:", err);

    res.status(500).json({
      error: "Search failed"
    });

  }

});



/* =====================================================
   CREATE NEW STATION
===================================================== */

router.post("/", auth, requireAdmin, async (req, res) => {

  try {

    const {

      name,
      code,
      address,
      city,
      district,
      state,
      pincode,
      contact_phone,
      contact_email

    } = req.body;


    if (!name || !code || !city || !district)
      return res.status(400).json({
        error: "Missing required fields"
      });


    /* DUPLICATE CHECK */

    const exists = await pool.query(`

      SELECT id
      FROM stations
      WHERE LOWER(name) = LOWER($1)
      OR LOWER(code) = LOWER($2)

    `, [name, code]);


    if (exists.rows.length > 0)
      return res.status(400).json({
        error: "Station already exists"
      });


    /* INSERT */

    const result = await pool.query(`

      INSERT INTO stations (

        name,
        code,
        address,
        city,
        district,
        state,
        pincode,
        contact_phone,
        contact_email,
        status

      )

      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active')

      RETURNING *

    `, [

      name,
      code,
      address || null,
      city,
      district,
      state || "Karnataka",
      pincode || null,
      contact_phone || null,
      contact_email || null

    ]);


    res.json({

      success: true,
      station: result.rows[0]

    });

  }
  catch (err) {

    console.error("Create station error:", err);

    res.status(500).json({
      error: "Failed to create station"
    });

  }

});



/* =====================================================
   ACTIVATE / DEACTIVATE STATION
   Never delete stations
===================================================== */

router.patch("/:id/status", auth, requireAdmin, async (req, res) => {

  try {

    const { status } = req.body;

    if (!["active", "inactive"].includes(status))
      return res.status(400).json({
        error: "Invalid status"
      });


    await pool.query(`

      UPDATE stations
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2

    `, [status, req.params.id]);


    res.json({
      success: true
    });

  }
  catch (err) {

    console.error("Status update error:", err);

    res.status(500).json({
      error: "Failed to update status"
    });

  }

});



/* =====================================================
   GET OFFICERS ASSIGNED TO STATION
===================================================== */

router.get("/:id/officers", auth, requireAdmin, async (req, res) => {

  try {

    const stationResult = await pool.query(`

      SELECT name
      FROM stations
      WHERE id = $1

    `, [req.params.id]);


    if (stationResult.rows.length === 0)
      return res.json([]);


    const stationName = stationResult.rows[0].name;


    const officers = await pool.query(`

      SELECT
        u.id,
        u.login_id,
        u.full_name,
        u.role

      FROM officer_station_assignments osa

      JOIN users u
      ON u.id = osa.officer_id

      WHERE
        osa.station_name = $1
        AND osa.relieved_at IS NULL

      ORDER BY u.full_name

    `, [stationName]);


    res.json(officers.rows);

  }
  catch (err) {

    console.error("Fetch officers error:", err);

    res.status(500).json({
      error: "Failed to fetch officers"
    });

  }

});



module.exports = router;