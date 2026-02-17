const jwt = require("jsonwebtoken");
const pool = require("../db");

module.exports = async (req, res, next) => {

  try {

    /* ================= AUTH HEADER VALIDATION ================= */

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Invalid authorization format"
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.length < 10) {
      return res.status(401).json({
        error: "Invalid token provided"
      });
    }

    /* ================= JWT SECRET CHECK ================= */

    if (!process.env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET missing");
      return res.status(500).json({
        error: "Server misconfiguration"
      });
    }

    /* ================= VERIFY TOKEN ================= */

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (!decoded?.userId) {
      return res.status(401).json({
        error: "Invalid token payload"
      });
    }

    /* ================= VERIFY USER STILL EXISTS ================= */

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        role,
        status
      FROM users
      WHERE id = $1
      `,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "User account no longer exists"
      });
    }

    const user = result.rows[0];

    /* ================= ACCOUNT STATUS VALIDATION ================= */

    if (user.status === "blocked") {
      return res.status(403).json({
        error: "Account blocked by administrator"
      });
    }

    if (user.status === "pending") {
      return res.status(403).json({
        error: "Account not yet approved by administrator"
      });
    }

    /* ================= SAFE USER CONTEXT ================= */

    req.user = Object.freeze({
      userId: user.id,
      role: user.role,
      name: user.full_name,
      email: user.email
    });

    next();

  }
  catch (err) {

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Session expired. Please login again."
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid or malformed token."
      });
    }

    console.error("Auth Middleware Error:", err.message);

    return res.status(401).json({
      error: "Authentication failed"
    });

  }

};
