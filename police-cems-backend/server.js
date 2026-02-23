const express = require("express");
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
const { login } = require("./controllers/authController");
const adminRoutes = require("./routes/admin");

/* ================= APP INIT ================= */
const app = express();   // 🔥 MUST COME BEFORE app.disable()

/* ================= SECURITY ================= */
app.disable("x-powered-by");   // ✅ NOW SAFE

app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(morgan("dev"));

/* ================= CORS ================= */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked Origin:", origin);
    return callback(new Error("CORS blocked"));
  },
  credentials: true
}));

/* ================= RATE LIMIT ================= */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api", apiLimiter);

/* ================= BODY LIMIT ================= */
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/password", require("./routes/password"));
app.use("/api/cases", require("./routes/cases"));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/transfers", transfersRoutes);
app.use("/api/custody", require("./routes/custody"));
app.use("/api/admin", require("./routes/admin"));

/* ================= STATIC ================= */
app.use("/uploads", express.static("uploads", {
  dotfiles: "deny",
  index: false,
  maxAge: "1d"
}));

/* ================= 404 ================= */
app.use((req, res) => {
  res.status(404).json({ error: "Resource not found" });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("Global error:", err.message);

  if (err.message === "CORS blocked") {
    return res.status(403).json({ error: "Access denied" });
  }

  res.status(500).json({ error: "Internal server error" });
});

/* ================= START ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
