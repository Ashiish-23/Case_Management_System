const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

/* ================= SECURITY HELPERS ================= */
function safeInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

/* =========================================================
   DASHBOARD STATS (LEDGER FACTS ONLY — HARDENED)
========================================================= */
router.get("/stats", auth, async (req, res) => {
  const startTime = Date.now();
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM cases)               AS total_cases,
        (SELECT COUNT(*) FROM evidence)            AS total_evidence,
        (SELECT COUNT(*) FROM evidence_transfers)  AS total_transfers,
        (SELECT COUNT(*) FROM evidence_custody)    AS custody_records
    `);

    const row = result.rows[0] || {};

    const responsePayload = {
      totalCases: safeInt(row.total_cases),
      evidenceItems: safeInt(row.total_evidence),
      transfers: safeInt(row.total_transfers),
      custodyRecords: safeInt(row.custody_records),
      /* Reserved for future tamper detection engine */
      chainViolations: 0
    };

    /* ===== TIMING FLOOR (Anti Load Inference) ===== */
    const elapsed = Date.now() - startTime;
    if (elapsed < 120) {
      await delay(120 - elapsed);
    }
    res.json(responsePayload);
  } catch (err) {
    console.error("Dashboard stats error:", err.message);
    await delay(120); // keep timing consistent
    res.status(500).json({
      error: "Dashboard stats failed"
    });
  }
});

module.exports = router;
