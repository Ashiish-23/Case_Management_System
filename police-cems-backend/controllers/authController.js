const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");

/**
 * REGISTER
 */
exports.register = async (req, res) => {
  const { name, loginId, email, password, role } = req.body;

  try {
    // Check if loginId already exists
    const exists = await pool.query(
      "SELECT id FROM users WHERE login_id = $1",
      [loginId]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Login ID already exists" });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Insert user
    await pool.query(
      `INSERT INTO users (full_name, login_id, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, loginId, email, hash, role]
    );

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

/**
 * LOGIN
 */
exports.login = async (req, res) => {
  const { loginId, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT id, full_name, role, password_hash
       FROM users WHERE login_id = $1`,
      [loginId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        name: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        name: user.full_name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
