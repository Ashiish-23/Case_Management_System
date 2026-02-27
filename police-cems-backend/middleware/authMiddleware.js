const jwt = require("jsonwebtoken");
const pool = require("../db");

module.exports = async (req, res, next) => {
  try {

    /* ================= AUTH HEADER ================= */

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        error: "Invalid token"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET missing");
      return res.status(500).json({
        error: "Server configuration error"
      });
    }

    /* ================= VERIFY JWT ================= */

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

    /* ================= LOAD USER ================= */

    const result = await pool.query(
      `SELECT id, full_name, email, role, status
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        error: "User no longer exists"
      });
    }

    const user = result.rows[0];

    /* ================= STATUS ENFORCEMENT ================= */

    const status = (user.status || "").toLowerCase().trim();

    if (status === "blocked") {
      return res.status(403).json({
        error: "Account blocked"
      });
    }

    if (status !== "approved") {
      return res.status(403).json({
        error: status === "pending"
          ? "Account pending admin approval"
          : "Access denied"
      });
    }

    /* ================= SAFE CONTEXT ================= */

    req.user = Object.freeze({
      userId: user.id,
      role: (user.role || "").toUpperCase().trim(),
      name: user.full_name,
      email: user.email
    });

    next();

  } catch (err) {

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Session expired. Please login again."
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid or malformed token"
      });
    }

    console.error("Auth Middleware Error:", err.message);

    return res.status(401).json({
      error: "Authentication failed"
    });
  }
}; 