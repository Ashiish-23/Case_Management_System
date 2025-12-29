const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// generate something like KSP-2025-000123
async function generateCaseNumber (){
  const result = await pool.query(
    "SELECT COUNT(*) FROM cases"
  );
  const count = Number(result.rows[0].count) + 1;
  return `KSP-${new Date().getFullYear()}-${String(count).padStart(6,"0")}`;
}

router.post("/create", auth, async(req,res)=>{

  try{

    if(req.user.role === "Constable")
      return res.status(403).json({error:"Not authorized"});

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

    await pool.query(
      `INSERT INTO cases
      (case_number,fir_number,station_name,officer_name,officer_rank,
       officer_login_id,case_title,description,case_type,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        caseNumber,
        firNumber ?? null,
        stationName,
        officerName,
        officerRank,
        req.user.userId,
        caseTitle,
        description,
        caseType,
        req.user.userId
      ]
    );

    res.json({
      success:true,
      caseNumber
    });

  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server error"});
  }

});

module.exports = router;
