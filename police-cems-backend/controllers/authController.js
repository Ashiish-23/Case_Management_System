const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { sendEventEmail } = require("../services/emailService");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  const { name, loginId, email, password, role } = req.body;
  try {
    /* 1️⃣ Check Login ID */
    const exists = await pool.query( "SELECT id FROM users WHERE login_id = $1", [loginId] );

    if (exists.rows.length > 0) {
      return res.status(409).json({ error: "Login ID already exists" });
    }

    /* 2️⃣ Hash Password */
    const hash = await bcrypt.hash(password, 12);
    /* 3️⃣ Insert User */
    const result = await pool.query(`
      INSERT INTO users (full_name, login_id, email, password_hash, role)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, full_name, login_id, email
    `, [name, loginId, email, hash, role]);
    const user = result.rows[0];

    res.status(201).json({
      message: "User registered successfully"
    });

    /* 4️⃣ SIDE EFFECT EMAIL */
    sendEventEmail({
      eventType: "USER_REGISTERED_NOTIFICATION",
      data: {
        email: user.email,
        fullName: user.full_name,
        loginId: user.login_id,
        userId: user.id
      },
      db: pool
    }).catch(err =>
      console.error("Registration email failed:", err.message)
    );
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  const { loginId, password } = req.body;
  try {
    const result = await pool.query(`
      SELECT id, full_name, role, email, password_hash
      FROM users
      WHERE login_id = $1
    `, [loginId]);

    if (!result.rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({
      userId: user.id,
      role: user.role,
      name: user.full_name,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN });

    res.json({
      token,
      user: {
        name: user.full_name,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
