const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {

    /* ================= AUTH HEADER VALIDATION ================= */
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Invalid authorization format" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.length < 10) {
      return res.status(401).json({ error: "Invalid token provided" });
    }

    /* ================= JWT SECRET CHECK ================= */
    if (!process.env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET missing");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    /* ================= VERIFY TOKEN ================= */
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    /* ================= PAYLOAD CHECK ================= */
    if (!decoded || !decoded.userId || !decoded.email) {
      return res.status(401).json({ error: "Invalid token payload structure" });
    }

    /* ================= SAFE USER CONTEXT ================= */
    req.user = Object.freeze({
      userId: decoded.userId,
      role: decoded.role,   // ← FIXED
      name: decoded.name || "Unknown",
      email: decoded.email
    });

    next();

  } catch (err) {

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired. Please login again." });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid or malformed token." });
    }

    console.error("Auth Middleware Error:", err.message);

    return res.status(401).json({ error: "Authentication failed" });
  }
};
