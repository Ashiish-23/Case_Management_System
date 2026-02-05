const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT PAYLOAD:", decoded);

    req.user = {
      userId: decoded.userId,   // <-- VERY IMPORTANT
      role: decoded.role,
      name: decoded.name,
      email: decoded.email
    };

    next();

  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
