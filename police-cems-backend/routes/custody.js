const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* ================= SECURITY HELPERS ================= */

function isValidUUID(id) {
  return /^[0-9a-fA-F-]{36}$/.test(id);
}

/* Artificial delay to reduce enumeration timing attacks */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
  GET CURRENT CUSTODY BY EVIDENCE ID
  Security Level: HIGH (Operational Sensitive)
*/

router.get("/:evidenceId", auth, async (req, res) => {

  const startTime = Date.now();

  try {

    const evidenceId = req.params.evidenceId;

    /* ===== UUID VALIDATION ===== */
    if (!isValidUUID(evidenceId)) {
      await delay(120); // anti-enumeration
      return res.status(400).json({
        error: "Invalid evidence identifier"
      });
    }

    const result = await pool.query(
      `
      SELECT
        ec.evidence_id,
        ec.current_station,
        ec.current_holder_id,
        e.evidence_code,
        e.case_id
      FROM evidence_custody ec
      JOIN evidence e ON e.id = ec.evidence_id
      WHERE ec.evidence_id = $1
      LIMIT 1
      `,
      [evidenceId]
    );

    if (!result.rows.length) {

      /* Smooth timing so attacker can't distinguish */
      const elapsed = Date.now() - startTime;
      if (elapsed < 120) {
        await delay(120 - elapsed);
      }

      return res.status(404).json({
        error: "Custody record not found"
      });
    }

    /* Minimal Exposure Response */
    res.json({
      evidenceId: result.rows[0].evidence_id,
      evidenceCode: result.rows[0].evidence_code,
      caseId: result.rows[0].case_id,
      currentStation: result.rows[0].current_station,
      currentHolderId: result.rows[0].current_holder_id
    });

  } catch (err) {

    console.error("Custody fetch error:", err.message);

    res.status(500).json({
      error: "Failed to fetch custody"
    });

  }
});

module.exports = router;
