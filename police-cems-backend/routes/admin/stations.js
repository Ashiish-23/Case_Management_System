const express = require("express");
const router = express.Router();

const pool = require("../../db");

const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");


/* =====================================================
   GET ALL STATIONS (FULL DETAILS + PAGINATION)
===================================================== */

router.get("/", auth, requireAdmin, async (req, res) => {

  try {

    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;
    let search = req.query.search || "";

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;


    /* COUNT */

    const countResult = await pool.query(`
      SELECT COUNT(*)
      FROM stations
      WHERE name ILIKE $1
    `, [`%${search}%`]);

    const total = Number(countResult.rows[0].count);


    /* MAIN QUERY */

    const result = await pool.query(`

      SELECT
        s.id,
        s.name,
        s.code,
        s.address,
        s.city,
        s.district,
        s.state,
        s.pincode,
        s.contact_phone,
        s.contact_email,
        s.status,
        s.created_at,
        s.updated_at,

        COALESCE((
          SELECT COUNT(*)
          FROM officer_station_assignments osa
          WHERE osa.station_id = s.id
          AND osa.relieved_at IS NULL
        ),0) AS officer_count,

        COALESCE((
          SELECT COUNT(*)
          FROM cases c
          WHERE c.station_id = s.id
        ),0) AS case_count

      FROM stations s

      WHERE s.name ILIKE $1

      ORDER BY s.name ASC

      LIMIT $2 OFFSET $3

    `, [`%${search}%`, limit, offset]);


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
   AUTOCOMPLETE SEARCH (AMAZON STYLE)
   PUBLIC SAFE FOR TRANSFER INPUT DROPDOWN
===================================================== */

router.get("/search", auth, async (req, res) => {

  try {

    const q = req.query.q || "";

    if (q.length < 1)
      return res.json([]);

    const result = await pool.query(`

      SELECT
        id,
        name,
        city,
        district

      FROM stations

      WHERE name ILIKE $1
      AND status = 'active'

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
   CREATE NEW STATION (FULL DATA)
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


    if (!name || !code || !address || !city || !district)
      return res.status(400).json({
        error: "Missing required fields"
      });


    const exists = await pool.query(`
      SELECT id FROM stations
      WHERE LOWER(name) = LOWER($1)
      OR LOWER(code) = LOWER($2)
    `, [name, code]);


    if (exists.rows.length > 0)
      return res.status(400).json({
        error: "Station already exists"
      });


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
        contact_email

      )

      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)

      RETURNING *

    `, [

      name,
      code,
      address,
      city,
      district,
      state || "Karnataka",
      pincode,
      contact_phone,
      contact_email

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
   UPDATE STATION DETAILS
===================================================== */

router.patch("/:id", auth, requireAdmin, async (req, res) => {

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
      contact_email,
      status

    } = req.body;


    await pool.query(`

      UPDATE stations SET

        name = $1,
        code = $2,
        address = $3,
        city = $4,
        district = $5,
        state = $6,
        pincode = $7,
        contact_phone = $8,
        contact_email = $9,
        status = $10,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $11

    `, [

      name,
      code,
      address,
      city,
      district,
      state,
      pincode,
      contact_phone,
      contact_email,
      status,
      req.params.id

    ]);


    res.json({
      success: true
    });

  }
  catch (err) {

    console.error("Update station error:", err);

    res.status(500).json({
      error: "Update failed"
    });

  }

});


/* =====================================================
   DELETE STATION (SAFE)
===================================================== */

router.delete("/:id", auth, requireAdmin, async (req, res) => {

  try {

    const inUse = await pool.query(`

      SELECT 1
      FROM officer_station_assignments
      WHERE station_id = $1
      LIMIT 1

    `, [req.params.id]);


    if (inUse.rows.length > 0)
      return res.status(400).json({
        error: "Station is in use"
      });


    await pool.query(`
      DELETE FROM stations
      WHERE id = $1
    `, [req.params.id]);


    res.json({
      success: true
    });

  }
  catch (err) {

    console.error("Delete station error:", err);

    res.status(500).json({
      error: "Delete failed"
    });

  }

});


/* =====================================================
   GET OFFICERS IN STATION
===================================================== */

router.get("/:id/officers", auth, requireAdmin, async (req, res) => {

  try {

    const result = await pool.query(`

      SELECT
        u.id,
        u.login_id,
        u.full_name,
        u.role

      FROM officer_station_assignments osa

      JOIN users u
      ON u.id = osa.officer_id

      WHERE osa.station_id = $1
      AND osa.relieved_at IS NULL

      ORDER BY u.full_name

    `, [req.params.id]);


    res.json(result.rows);

  }
  catch (err) {

    console.error("Fetch officers error:", err);

    res.status(500).json({
      error: "Failed to fetch officers"
    });

  }

});


module.exports = router;