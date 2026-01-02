const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");


// ---------- FILE STORAGE ----------
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });



// ---------- GET EVIDENCE FOR CASE ----------
router.get("/case/:id", auth, async (req,res)=>{
  try{
    const result = await pool.query(`
      SELECT * FROM evidence
      WHERE case_id=$1
      ORDER BY logged_at DESC
    `,[req.params.id]);

    res.json(result.rows);

  }catch(e){
    console.error(e);
    res.status(500).json({error:"Server Error"});
  }
});



// ---------- ADD EVIDENCE ----------
router.post("/add", auth, upload.single("image"), async (req,res)=>{
  try{
    const { caseId, description, category } = req.body;

    await pool.query(`
      INSERT INTO evidence(case_id,description,category,image_path,logged_by)
      VALUES($1,$2,$3,$4,$5)
    `,[
      caseId,
      description,
      category,
      req.file ? req.file.filename : null,
      req.user.userId
    ]);

    res.json({success:true});

  }catch(e){
    console.error(e);
    res.status(500).json({error:"Server Error"});
  }
});

module.exports = router;
