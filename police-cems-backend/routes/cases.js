const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");


/* =========================================================
   CASE NUMBER GENERATOR
========================================================= */
async function generateCaseNumber(){
  const result = await pool.query("SELECT COUNT(*) FROM cases");
  const count = Number(result.rows[0].count) + 1;

  return `KSP-${new Date().getFullYear()}-${String(count).padStart(6,"0")}`;
}


/* =========================================================
   CREATE CASE
========================================================= */
router.post("/create", auth, async(req,res)=>{

  try{
    const officerId = req.user.userId;

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
      officerId,
      caseTitle,
      description,
      caseType,
      officerId
    ]);

    res.json({ success:true, caseNumber });

  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server error"});
  }
});


/* =========================================================
   LIST ALL CASES
========================================================= */
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


/* =========================================================
   GET ONE CASE
========================================================= */
router.get("/:id", auth, async(req,res)=>{

  try{
    const result = await pool.query(
      "SELECT * FROM cases WHERE id=$1",
      [req.params.id]
    );

    if(!result.rowCount)
      return res.status(404).json({error:"Case not found"});

    res.json(result.rows[0]);

  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server Error"});
  }
});


/* =========================================================
   CLOSE CASE
========================================================= */
router.post("/close", auth, async(req,res)=>{

  try{
    const { caseId, reason, authority_reference } = req.body;

    if(!reason || !authority_reference)
      return res.status(400).json({ error:"Reason & authority reference required" });

    const userId = req.user.userId;

    const current = await pool.query(
      "SELECT status FROM cases WHERE id=$1",
      [caseId]
    );

    if(!current.rowCount)
      return res.status(404).json({ error:"Case not found" });

    const prev = current.rows[0].status;

    if(prev === "CLOSED")
      return res.status(400).json({ error:"Already closed" });


    await pool.query(`
      INSERT INTO case_status_history
      (case_id, previous_status, new_status, reason, changed_by)
      VALUES ($1,$2,$3,$4,$5)
    `,[caseId, prev, "CLOSED", reason, userId]);


    await pool.query(
      "UPDATE cases SET status='CLOSED' WHERE id=$1",
      [caseId]
    );

    res.json({ success:true });

  }catch(err){
    console.error(err);
    res.status(500).json({ error:"Server error" });
  }
});


/* =========================================================
   REOPEN CASE
========================================================= */
router.post("/:id/reopen", auth, async(req,res)=>{

  try{
    const caseId = req.params.id;
    const { reason } = req.body;

    const userId = req.user.userId;
    const role = req.user.role;

    if(!reason)
      return res.status(400).json({ error:"Reason required" });

    /*if(role !== "ADMIN" && role !== "SHO")
      return res.status(403).json({error:"Not authorized"});*/


    const current = await pool.query(
      "SELECT status FROM cases WHERE id=$1",
      [caseId]
    );

    if(!current.rowCount)
      return res.status(404).json({error:"Case not found"});

    const prev = current.rows[0].status;

    if(prev !== "CLOSED")
      return res.status(400).json({error:"Case not closed"});


    await pool.query(`
      INSERT INTO case_status_history
      (case_id, previous_status, new_status, reason, changed_by)
      VALUES ($1,$2,'REOPENED',$3,$4)
    `,[caseId, prev, reason, userId]);


    await pool.query(
      "UPDATE cases SET status='REOPENED' WHERE id=$1",
      [caseId]
    );

    res.json({success:true});

  }catch(err){
    console.error(err);
    res.status(500).json({error:"Server error"});
  }
});


module.exports = router;
