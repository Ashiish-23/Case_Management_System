const express = require("express");
app.disable("x-powered-by");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
require("dotenv").config();

/* ================= ROUTES ================= */
const authRoutes = require("./routes/auth");
const evidenceRoutes = require("./routes/evidence");
const transfersRoutes = require("./routes/transfers");
const dashboardRoutes = require("./routes/dashboard");

/* ================= APP INIT ================= */
const app = express();

/* ================= TRUST PROXY ================= */
/* Required for rate limiting behind reverse proxy later */
app.set("trust proxy", 1);

/* ================= SECURITY HEADERS ================= */
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));


/* ================= REQUEST LOGGING ================= */
app.use(morgan("combined"));

/* ================= CORS HARDENING ================= */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {

    // Allow server-to-server / Postman / mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked"));
  },
  credentials: true
}));

/* ================= RATE LIMITING ================= */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                 // 300 requests / IP / window
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api", apiLimiter);

/* ================= BODY PARSING LIMITS ================= */
app.use(express.json({
  limit: "100kb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "100kb"
}));

app.use((req, res, next) => {
  res.setTimeout(15000, () => {
    res.status(408).json({ error: "Request timeout" });
  });
  next();
});

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/password", require("./routes/password"));
app.use("/api/cases", require("./routes/cases"));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/transfers", transfersRoutes);
app.use("/api/custody", require("./routes/custody"));

/* ================= STATIC FILE SECURITY ================= */
app.use("/uploads", express.static("uploads", {
  dotfiles: "deny",
  index: false,
  maxAge: "1d"
}));

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({
    error: "Resource not found"
  });
});

/* ================= GLOBAL ERROR HANDLER ================= */
app.use((err, req, res, next) => {

  console.error("Global error:", err.message);

  if (err.message === "CORS blocked") {
    return res.status(403).json({
      error: "Access denied"
    });
  }

  res.status(500).json({
    error: "Internal server error"
  });
});

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
