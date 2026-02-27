const express = require("express");
const router = express.Router();

const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* ================= HELPERS ================= */

function isValidUUID(id) { return /^[0-9a-fA-F-]{36}$/.test(id); }

function cleanText(str, maxLen) {

  if (!str) return null;

  return str
    .toString()
    .trim()
    .normalize("NFKC")
    .substring(0, maxLen);
}

async function generateCaseNumber(client) {

  // Sync sequence automatically with table
  await client.query(`
    SELECT setval(
      'case_number_seq',
      (
        SELECT COALESCE(
          MAX(CAST(SUBSTRING(case_number FROM '[0-9]+$') AS INTEGER)),
          0
        )
        FROM cases
      )
    )
  `);

  const seqRes = await client.query( `SELECT nextval('case_number_seq') AS seq` );

  const seq = seqRes.rows[0].seq;

  return `KSP-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

/* =========================================================
   CREATE CASE
========================================================= */
router.post("/create", auth, async (req, res) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const officerId = req.user.userId;

    if (!isValidUUID(officerId)) {
      return res.status(401).json({ error: "Invalid identity" });
    }

    const {
      caseTitle,
      caseType,
      description,
      officerName,
      officerRank,
      firNumber,
      stationName // Only used if admin
    } = req.body;

    /* ================= DETERMINE STATION ================= */

    let finalStationName = null;

    if (req.user.role === "admin") {

      // Admin can specify station
      if (!stationName)
        return res.status(400).json({ error: "Station required" });

      finalStationName = cleanText(stationName, 120);

    } else {

      // Officer → auto derive station
      const stationResult = await client.query(`
        SELECT station_name
        FROM officer_station_assignments
        WHERE officer_id = $1
        AND relieved_at IS NULL
      `, [officerId]);

      if (!stationResult.rows.length) {
        return res.status(403).json({
          error: "Officer not assigned to any active station"
        });
      }

      finalStationName = stationResult.rows[0].station_name;
    }

    /* ================= VALIDATE STATION STATUS ================= */

    const stationCheck = await client.query(`
      SELECT status
      FROM stations
      WHERE name = $1
    `, [finalStationName]);

    if (!stationCheck.rows.length) {
      return res.status(404).json({ error: "Station not found" });
    }

    if (stationCheck.rows[0].status !== "active") {
      return res.status(403).json({ error: "Station is disabled" });
    }

    /* ================= GENERATE CASE NUMBER ================= */

    const caseNumber = await generateCaseNumber(client);

    /* ================= INSERT CASE ================= */

    await client.query(`
      INSERT INTO cases (
        case_number,
        fir_number,
        station_name,
        officer_name,
        officer_rank,
        officer_login_id,
        case_title,
        description,
        case_type,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `, [
      caseNumber,
      cleanText(firNumber, 60),
      finalStationName,
      cleanText(officerName, 120),
      cleanText(officerRank, 60),
      officerId,
      cleanText(caseTitle, 150),
      cleanText(description, 2000),
      cleanText(caseType, 80),
      officerId
    ]);

    await client.query("COMMIT");

    res.json({ success: true, caseNumber });

  } catch (err) {

    await client.query("ROLLBACK");
    console.error("Case creation error:", err);
    res.status(500).json({ error: "Case creation failed" });

  } finally {
    client.release();
  }
});


/* =========================================================
   LIST CASES (SEARCH + PAGINATION)
========================================================= */

router.get("/", auth, async (req,res)=>{

  try{
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 15;

    if(limit > 100) limit = 100;
    if(page < 1) page = 1;

    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || "";

    let where = "";
    let values = [];

    if(search.length >= 2){
      where = `
        WHERE
        case_number ILIKE $1 OR
        case_title ILIKE $1 OR
        case_type ILIKE $1 OR
        station_name ILIKE $1
      `;
      values.push(`%${search}%`);
    }

    /* total count */
    const totalResult = await pool.query( `SELECT COUNT(*) FROM cases ${where}`, values );
    const total = parseInt(totalResult.rows[0].count);

    /* page data */
    const dataResult = await pool.query(
      `
      SELECT
      id,
      case_number,
      case_title,
      case_type,
      station_name,
      registered_date
      FROM cases
      ${where}
      ORDER BY created_at DESC
      LIMIT $${values.length+1}
      OFFSET $${values.length+2}
      `,
      [...values, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total/limit)
    });

  }
  catch(err){
    console.error(err);
    res.status(500).json({
      error:"Case list failed"
    });
  }
});


/* =========================================================
   GET SINGLE CASE
========================================================= */
router.get("/:id", auth, async (req,res)=>{
  try{
    const id = req.params.id;

    if(!isValidUUID(id))
      return res.status(400).json({
        error:"Invalid case ID"
      });

    const result = await pool.query( `SELECT * FROM cases WHERE id=$1`, [id] );

    if(result.rows.length===0)
      return res.status(404).json({
        error:"Case not found"
      });

    res.json(result.rows[0]);

  }
  catch(err){
    console.error(err);

    res.status(500).json({
      error:"Case fetch failed"
    });
  }
});

module.exports = router;
