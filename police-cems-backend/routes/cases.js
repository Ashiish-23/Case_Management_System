const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* ================= LIMITS ================= */

const LIMITS = {
  TITLE: 150,
  DESCRIPTION: 2000,
  NAME: 120,
  RANK: 60,
  STATION: 120,
  FIR: 60
};

/* ================= HELPERS ================= */

function cleanText(str, maxLen) {
  if (!str) return null;

  return str
    .toString()
    .trim()
    .normalize("NFKC")
    .substring(0, maxLen);
}

function isValidFIR(fir) {
  if (!fir) return true;
  return /^[A-Za-z0-9\-\/]{3,60}$/.test(fir);
}

function isValidUUID(id) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

/* =========================================================
   SAFE CASE NUMBER (DB SEQUENCE BASED)
========================================================= */

async function generateCaseNumber(client) {

  const seqRes = await client.query(
    `SELECT nextval('case_number_seq') AS seq`
  );

  const seq = seqRes.rows[0].seq;

  return `KSP-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}

/* =========================================================
   CREATE CASE
========================================================= */

router.post("/create", auth, async (req, res) => {

  const client = await pool.connect();

  try {

    const officerId = req.user.userId;

    if (!isValidUUID(officerId)) {
      return res.status(401).json({ error: "Invalid identity" });
    }

    let {
      caseTitle,
      caseType,
      description,
      officerName,
      officerRank,
      stationName,
      firNumber
    } = req.body;

    /* ========= CLEAN ========= */

    caseTitle = cleanText(caseTitle, LIMITS.TITLE);
    caseType = cleanText(caseType, 80);
    description = cleanText(description, LIMITS.DESCRIPTION);
    officerName = cleanText(officerName, LIMITS.NAME);
    officerRank = cleanText(officerRank, LIMITS.RANK);
    stationName = cleanText(stationName, LIMITS.STATION);
    firNumber = cleanText(firNumber, LIMITS.FIR);

    /* ========= VALIDATE ========= */

    if (
      !caseTitle ||
      !caseType ||
      !description ||
      !officerName ||
      !officerRank ||
      !stationName
    ) {
      return res.status(400).json({
        error: "Invalid or missing required fields"
      });
    }

    if (!isValidFIR(firNumber)) {
      return res.status(400).json({
        error: "Invalid FIR format"
      });
    }

    await client.query("BEGIN");

    const caseNumber = await generateCaseNumber(client);

    await client.query(
      `
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
      `,
      [
        caseNumber,
        firNumber || null,
        stationName,
        officerName,
        officerRank,
        officerId,
        caseTitle,
        description,
        caseType,
        officerId
      ]
    );

    await client.query("COMMIT");

    res.json({ success: true, caseNumber });

  } catch (err) {

    await client.query("ROLLBACK");

    console.error("Case create error:", err.message);

    res.status(500).json({ error: "Failed to create case" });

  } finally {
    client.release();
  }
});

/* =========================================================
   LIST CASES (WITH SEARCH + PAGINATION + TOTAL COUNT)
========================================================= */

router.get("/", auth, async (req, res) => {

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
          case_number ILIKE $1 OR
          case_title ILIKE $1 OR
          case_type ILIKE $1 OR
          station_name ILIKE $1
      `;

      values.push(`%${search}%`);
    }

    /* ===== GET TOTAL COUNT ===== */

    const countQuery = `
      SELECT COUNT(*) FROM cases
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    /* ===== GET PAGE DATA ===== */

    const dataQuery = `
      SELECT
        id,
        case_number,
        case_title,
        case_type,
        station_name,
        registered_date,
        created_at
      FROM cases
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    values.push(limit, offset);

    const dataResult = await pool.query(dataQuery, values);

    res.json({
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {

    console.error("Case list error:", err.message);

    res.status(500).json({
      error: "Failed to load cases"
    });

  }

});

/* =========================================================
   GET ONE CASE
========================================================= */
router.get("/", auth, async (req, res) => {

  try {

    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 15;
    const search = req.query.search?.trim();

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    let whereClause = "";
    const values = [];

    if (search && search.length >= 2) {

      whereClause = `
        WHERE
          case_number ILIKE $1 OR
          case_title ILIKE $1 OR
          case_type ILIKE $1 OR
          station_name ILIKE $1
      `;

      values.push(`%${search}%`);

    }

    /* COUNT TOTAL */

    const countQuery = `
      SELECT COUNT(*) FROM cases
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);

    const total = Number(countResult.rows[0].count);

    const totalPages = Math.ceil(total / limit);

    /* FETCH DATA */

    const dataQuery = `
      SELECT
        id,
        case_number,
        case_title,
        case_type,
        station_name,
        registered_date,
        created_at
      FROM cases
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const dataResult = await pool.query(
      dataQuery,
      [...values, limit, offset]
    );

    /* RETURN PAGINATED RESPONSE */

    res.json({
      data: dataResult.rows,
      totalPages,
      total,
      page
    });

  } catch (err) {

    console.error("Case list error:", err.message);

    res.status(500).json({
      error: "Failed to load cases"
    });

  }

});

module.exports = router;
