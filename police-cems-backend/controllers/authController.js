const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { sendEventEmail } = require("../services/emailService");

/* =====================================================
   REGISTER USER (DEFAULT STATUS = PENDING)
===================================================== */
exports.register = async (req, res) => {
  const { name, loginId, email, password, role } = req.body;
  try {
    /* 1️⃣ Check login ID uniqueness */
    const exists = await pool.query(
      "SELECT id FROM users WHERE login_id = $1",
      [loginId]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({
        error: "Login ID already exists"
      });
    }

    /* 2️⃣ Hash password */
    const hash = await bcrypt.hash(password, 12);

    /* 3️⃣ Insert user with PENDING status */
    const result = await pool.query(`
      INSERT INTO users (
        full_name,
        login_id,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1,$2,$3,$4,$5,'pending')
      RETURNING
        id,
        full_name,
        login_id,
        email,
        role,
        status
    `, [ name,
      loginId,
      email,
      hash,
      role || "officer"
    ]);
    const user = result.rows[0];

    /* 4️⃣ Respond immediately */
    res.status(201).json({
      message: "Registration successful. Waiting for admin approval."
    });

    /* 5️⃣ Notify admin via email (async side effect) */
    sendEventEmail({
      eventType: "USER_REGISTERED_NOTIFICATION",
      data: {
        email: user.email,
        fullName: user.full_name,
        loginId: user.login_id,
        userId: user.id,
        role: user.role,
        status: user.status
      },
      db: pool
    }).catch(err =>
      console.error("Registration email failed:", err.message)
    );

    /* 6️⃣ Optional: emit realtime notification if socket exists */
    if (req.io) {
      req.io.emit("admin:new_user_registered", {
        id: user.id,
        name: user.full_name,
        loginId: user.login_id,
        role: user.role,
        status: user.status
      });
    }
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({
      error: "Registration failed"
    });
  }
};

/* =====================================================
   LOGIN USER (ONLY APPROVED USERS ALLOWED)
===================================================== */
exports.login = async (req, res) => {
  const { loginId, password } = req.body;
  try {
    /* 1️⃣ Fetch user including status */
    const result = await pool.query(`
      SELECT
        id,
        full_name,
        role,
        email,
        password_hash,
        status
      FROM users
      WHERE login_id = $1 `, [loginId]);

    if (!result.rows.length) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    const user = result.rows[0];

    /* 2️⃣ Check password */
    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: "Invalid credentials"
      });
    }

    /* 3️⃣ Enforce admin approval */
    if (user.status === "pending") {
      return res.status(403).json({
        error: "Your account is pending admin approval"
      });
    }

    if (user.status === "blocked") {
      return res.status(403).json({
        error: "Your account has been blocked by admin"
      });
    }

    /* 4️⃣ Generate JWT token */
    const token = jwt.sign({
      userId: user.id,
      role: user.role,
      name: user.full_name,
      email: user.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h"
    });

    /* 5️⃣ Success response */
    res.json({
      token,
      user: {
        id: user.id,
        name: user.full_name,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({
      error: "Server error"
    });
  }
};