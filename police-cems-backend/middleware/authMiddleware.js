const jwt = require("jsonwebtoken");
const pool = require("../db");

module.exports = async (req, res, next) => {
  try {

    /* ================= AUTH HEADER VALIDATION ================= */

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

    /* ================= VERIFY USER FROM DATABASE ================= */

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

    /* ================= STRICT STATUS ENFORCEMENT ================= */

    if (user.status !== "approved") {

      const statusMessages = {
        pending: "Account pending admin approval",
        blocked: "Account blocked by administrator"
      };

      return res.status(403).json({
        error: statusMessages[user.status] || "Access denied"
      });
    }

    /* ================= OPTIONAL ROLE VALIDATION ================= */

    const allowedRoles = [
      "admin",
      "officer",
      "Constable",
      "Inspector",
      "SP"
    ];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: "Invalid user role"
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