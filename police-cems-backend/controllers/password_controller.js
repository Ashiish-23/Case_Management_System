const pool = require("../db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendEventEmail } = require("../services/emailService");

/* ================= CONSTANTS ================= */
const RESET_TOKEN_EXPIRY_MINUTES = 5;
const MIN_PASSWORD_LENGTH = 8;

/* ================= HELPERS ================= */
function isStrongPassword(pw) {
  if (!pw || pw.length < MIN_PASSWORD_LENGTH) return false;

  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);

  return hasUpper && hasLower && hasNumber;
}

/* =========================================================
   SEND PASSWORD RESET LINK
========================================================= */
exports.sendResetLink = async (req, res) => {
  const startTime = Date.now();
  const { email } = req.body;
  try {
    if (!email || typeof email !== "string") {
      return res.status(200).json({
        message: "If account exists, reset link will be sent"
      });
    }

    const userRes = await pool.query(
      `
      SELECT id, full_name, login_id, email
      FROM users
      WHERE LOWER(email) = LOWER($1)
      `,
      [email.trim()]
    );

    /* ⭐ ENUMERATION PROTECTION */
    if (!userRes.rows.length) {
      await new Promise(r => setTimeout(r, 300)); // timing noise
      return res.status(200).json({
        message: "If account exists, reset link will be sent"
      });
    }

    const user = userRes.rows[0];

    /* 🔐 TOKEN GENERATION */
    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    /* ⭐ OPTIONAL: Invalidate old tokens */
    await pool.query(
      `UPDATE password_resets SET used = true WHERE user_id = $1`,
      [user.id]
    );

    await pool.query(
      `
      INSERT INTO password_resets (user_id, reset_token, expires_at)
      VALUES ($1,$2,NOW() + INTERVAL '${RESET_TOKEN_EXPIRY_MINUTES} minutes')
      `,
      [user.id, tokenHash]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    console.log("Sending reset email to:", user.email);

    /* EMAIL SIDE EFFECT */
    sendEventEmail({
      eventType: "PASSWORD_RESET_REQUESTED",
      data: {
        email: user.email,
        fullName: user.full_name,
        loginId: user.login_id,
        resetLink,
        userId: user.id
      },
      db: pool
    })
    .then(r=> { console.log("reset mail result:", r); })
    .catch(err => {
      console.error("🚨 RESET EMAIL FAILED:", err);
    });

    return res.status(200).json({
      message: "If account exists, reset link will be sent"
    });

  } catch (err) {
    console.error("Reset request error:", err.message);
    return res.status(200).json({
      message: "If account exists, reset link will be sent"
    });
  }
};

/* =========================================================
   RESET PASSWORD
========================================================= */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Invalid request" });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      error: "Password must contain uppercase, lowercase, number and be 8+ chars"
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    /* ⭐ LOCK TOKEN ROW */
    const resetRes = await client.query(
      `
      SELECT pr.user_id, u.full_name, u.login_id, u.email
      FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.reset_token = $1
        AND pr.used = false
        AND pr.expires_at > NOW()
      FOR UPDATE
      `,
      [tokenHash]
    );

    if (!resetRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Invalid or expired token"
      });
    }

    const user = resetRes.rows[0];

    /* HASH PASSWORD */
    const passwordHash = await bcrypt.hash(newPassword, 12);

    /* UPDATE PASSWORD */
    await client.query( `UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, user.user_id] );

    /* MARK TOKEN USED */
    await client.query( `UPDATE password_resets SET used = true WHERE reset_token = $1`, [tokenHash] );

    /* ⭐ EXTRA HARDENING: Kill all other tokens */
    await client.query( `UPDATE password_resets SET used = true WHERE user_id = $1`, [user.user_id] );

    await client.query("COMMIT");

    res.json({ message: "Password updated successfully" });

    /* EMAIL SIDE EFFECT */
    sendEventEmail({
      eventType: "PASSWORD_CHANGED",
      data: {
        email: user.email,
        fullName: user.full_name,
        loginId: user.login_id,
        userId: user.user_id
      },
      db: pool
    }).catch(err => {
      console.error("🚨 RESET EMAIL FAILED:", err);
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Password reset error:", err.message);

    res.status(500).json({
      error: "Failed to reset password"
    });
  } finally {
    client.release();
  }
};
