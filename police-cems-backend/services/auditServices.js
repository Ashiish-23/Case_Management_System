const pool = require("../db");

async function createAuditLog({
  actorUserId,
  actorName,
  actionType,
  targetType,
  targetId,
  details,
  ipAddress
}) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (
        actor_user_id,
        actor_name,
        action_type,
        target_type,
        target_id,
        details,
        ip_address
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7) `,
      [ actorUserId || null,
        actorName || null,
        actionType,
        targetType,
        targetId || null,
        details || {},
        ipAddress || null
      ]
    );
  }
  catch (err) {
    console.error("Audit log failure:", err.message);
  }
}

module.exports = { createAuditLog };
