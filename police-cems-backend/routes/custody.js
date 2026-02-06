// Custody lookup endpoints (read-only).
const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/*
  GET CURRENT CUSTODY BY EVIDENCE ID
*/
router.get("/:evidenceId", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ec.evidence_id,
        ec.current_station,
        ec.current_holder_id,
        e.evidence_code,
        e.description,
        e.case_id
      FROM evidence_custody ec
      JOIN evidence e ON e.id = ec.evidence_id
      WHERE ec.evidence_id = $1
      `,
      [req.params.evidenceId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Custody record not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch custody" });
  }
});

module.exports = router;
