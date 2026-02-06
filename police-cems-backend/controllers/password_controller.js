// Password reset controller (token lifecycle + email side effects).
const pool = require("../db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendEventEmail } = require("../services/emailService");

/* =========================================================
   SEND PASSWORD RESET LINK
========================================================= */
exports.sendResetLink = async (req, res) => {
  const { email } = req.body;

  try {
    const userRes = await pool.query(
      `SELECT id, full_name, login_id, email
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ error: "Email not found" });
    }

    const user = userRes.rows[0];

    /* 🔐 Generate token */
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await pool.query(
      `
      INSERT INTO password_resets (user_id, reset_token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '15 minutes')
      `,
      [user.id, tokenHash]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    /* 🔔 SIDE EFFECT: EMAIL */
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
    }).catch(err =>
      console.error("Reset email failed:", err.message)
    );

    res.json({ message: "Password reset link sent" });

  } catch (err) {
    console.error("Send reset link error:", err);
    res.status(500).json({ error: "Failed to generate reset link" });
  }
};

/* =========================================================
   RESET PASSWORD (AUTHORITATIVE)
========================================================= */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetRes = await pool.query(
      `
      SELECT pr.user_id, u.full_name, u.login_id, u.email
      FROM password_resets pr
      JOIN users u ON u.id = pr.user_id
      WHERE pr.reset_token = $1
        AND pr.used = false
        AND pr.expires_at > NOW()
      `,
      [tokenHash]
    );

    if (!resetRes.rows.length) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const user = resetRes.rows[0];

    /* 🔐 Update password */
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, user.user_id]
    );

    await pool.query(
      `UPDATE password_resets SET used = true WHERE reset_token = $1`,
      [tokenHash]
    );

    res.json({ message: "Password updated successfully" });

    /* 🔔 SIDE EFFECT: SECURITY CONFIRMATION EMAIL */
    sendEventEmail({
      eventType: "PASSWORD_CHANGED",
      data: {
        email: user.email,
        fullName: user.full_name,
        loginId: user.login_id,
        userId: user.user_id
      },
      db: pool
    }).catch(err =>
      console.error("Password change email failed:", err.message)
    );

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
};
