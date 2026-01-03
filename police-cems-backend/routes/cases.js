const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

// ---------- CASE NUMBER GENERATOR ----------
async function generateCaseNumber(){
  const result = await pool.query("SELECT COUNT(*) FROM cases");
  const count = Number(result.rows[0].count) + 1;

  return `KSP-${new Date().getFullYear()}-${String(count).padStart(6,"0")}`;
}

// ---------- CREATE CASE ----------
router.post("/create", auth, async(req,res)=>{

  try{
    const officerId = req.user.userId;   // <-- logged-in officer

    const {
      caseTitle,
      caseType,
      description,
      officerName,
      officerRank,
      stationName,
      firNumber
    } = req.body;

    if(!caseTitle || !caseType || !description)
      return res.status(400).json({error:"Missing required fields"});

    const caseNumber = await generateCaseNumber();
    await pool.query(`
      INSERT INTO cases
      (case_number,fir_number,station_name,officer_name,officer_rank,
       officer_login_id,case_title,description,case_type,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    `,[
      caseNumber,
      firNumber ?? null,
      stationName,
      officerName,
      officerRank,
      officerId,        // <-- auto stamp login id
      caseTitle,
      description,
      caseType,
      officerId         // <-- auto stamp creator
    ]);

    res.json({
      success:true,
      caseNumber
    });

  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server error"});
  }
});

// ---------- LIST ALL CASES ----------
router.get("/", auth, async(req,res)=>{

  try{
    const result = await pool.query(`
      SELECT 
        id,
        case_number,
        case_title,
        case_type,
        status,
        registered_date
      FROM cases
      ORDER BY registered_date DESC
    `);

    res.json(result.rows);

  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server Error"});
  }

});

// ---------- GET CASE BY ID ----------
router.get("/:id", auth, async(req,res)=>{

  try{
    const result = await pool.query(
      "SELECT * FROM cases WHERE id=$1",
      [req.params.id]
    );

    res.json(result.rows[0]);

  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server Error"});
  }

});

module.exports = router;
