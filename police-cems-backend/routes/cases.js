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
   LIST CASES (PAGINATED)
========================================================= */

router.get("/", auth, async (req, res) => {

  try {

    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 25;

    if (limit > 100) limit = 100;
    if (page < 1) page = 1;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
      SELECT 
        id,
        case_number,
        case_title,
        case_type,
        station_name,
        registered_date,
        created_at
      FROM cases
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("Case list error:", err.message);
    res.status(500).json({ error: "Failed to load cases" });
  }
});

/* =========================================================
   GET ONE CASE
========================================================= */

router.get("/:id", auth, async (req, res) => {

  try {

    const id = req.params.id;

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid case id" });
    }

    const result = await pool.query(
      `SELECT * FROM cases WHERE id = $1`,
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: "Case not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Case fetch error:", err.message);
    res.status(500).json({ error: "Failed to fetch case" });
  }
});

module.exports = router;
