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

    if (!token || token.length < 20) {
      return res.status(401).json({ error: "Invalid token" });
    }

    /* ================= JWT VERIFY (STRICT) ================= */

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"] // lock algorithm (prevents downgrade attacks)
    });

    /* ================= PAYLOAD SANITY CHECK ================= */

    if (
      !decoded ||
      !decoded.userId ||
      !decoded.role ||
      !decoded.email
    ) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    /* ================= ROLE WHITELIST ================= */

    const allowedRoles = ["admin", "officer"];

    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    /* ================= SAFE USER CONTEXT ================= */

    req.user = Object.freeze({
      userId: decoded.userId,
      role: decoded.role,
      name: decoded.name || "Unknown",
      email: decoded.email
    });

    next();

  } catch (err) {

    /* ================= SAFE ERROR RESPONSES ================= */

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Session expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.error("Auth middleware error:", err.message);

    return res.status(401).json({
      error: "Authentication failed"
    });
  }
};
