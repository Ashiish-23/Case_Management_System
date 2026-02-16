module.exports = function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({
        error: "Admin access required"
      });
    }
    next();
  } catch (err) {
    console.error("Admin middleware error:", err.message);
    res.status(500).json({
      error: "Authorization failure"
    });
  }
};
