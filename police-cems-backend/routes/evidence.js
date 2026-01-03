const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");


// ---------- STORAGE ----------
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (_, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });


// ---------- GENERATE EVIDENCE CODE ----------
async function generateEvidenceCode(){
  const year = new Date().getFullYear();

  const result = await pool.query(`
    SELECT LPAD(nextval('evidence_seq')::text, 6, '0') AS num
  `);

  return `EVD-${year}-${result.rows[0].num}`;
}

// ---------- ADD ----------
router.post("/add", auth, upload.single("image"), async (req, res) => {

  try {

    const officerId = req.user.userId;   // <--- THIS IS NOW VERIFIED
    const { caseId, description, category } = req.body;

    const imagePath = req.file ? req.file.filename : null;

    // Generate code
    const resultCount = await pool.query("SELECT COUNT(*) FROM evidence");
    const count = Number(resultCount.rows[0].count) + 1;

    const evidenceCode =
      `EVD-${new Date().getFullYear()}-${String(count).padStart(6,"0")}`;

    // Insert
    const result = await pool.query(`
      INSERT INTO evidence
      (case_id, evidence_code, description, category, image_url, logged_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
    `,[
      caseId,
      evidenceCode,
      description,
      category,
      imagePath,
      officerId
    ]);

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }

});

// ---------- LIST ----------
router.get("/case/:caseId", auth, async(req,res)=>{
  try{
    const result = await pool.query(`
      SELECT 
        e.id,
        e.evidence_code,
        e.description,
        e.category,
        e.logged_at,
        u.full_name AS officer_name
      FROM evidence e
      LEFT JOIN users u
        ON e.logged_by = u.id
      WHERE e.case_id = $1
      ORDER BY e.logged_at DESC
    `,[req.params.caseId]);

    res.json(result.rows);
  }
  catch(err){
    console.error(err);
    res.status(500).json({error:"Server Error"});
  }
});

module.exports = router;
