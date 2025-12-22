const pool = require("../db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

exports.sendResetLink = async (req, res) => {
  const { email } = req.body;

  const userResult = await pool.query(
    "SELECT id FROM users WHERE email=$1",
    [email]
  );

  if (userResult.rows.length === 0)
    return res.status(404).json({ error: "Email not found" });

  const userId = userResult.rows[0].id;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await pool.query(
    `INSERT INTO password_resets (user_id, reset_token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '15 minutes')`,
    [userId, tokenHash]
  );

  const resetLink = `http://localhost:5173/reset-password?token=${token}`;

  // TEMP: console log instead of email (safe for dev)
    res.json({
        message: "Reset link generated",
        resetLink
    });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await pool.query(
    `SELECT user_id FROM password_resets
     WHERE reset_token=$1 AND used=false AND expires_at > NOW()`,
    [tokenHash]
  );

  if (result.rows.length === 0)
    return res.status(400).json({ error: "Invalid or expired token" });

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await pool.query(
    "UPDATE users SET password_hash=$1 WHERE id=$2",
    [passwordHash, result.rows[0].user_id]
  );

  await pool.query(
    "UPDATE password_resets SET used=true WHERE reset_token=$1",
    [tokenHash]
  );

  res.json({ message: "Password updated successfully" });
};
