const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const app = express();
const evidenceRoutes = require("./routes/evidence");
const transfersRoutes = require("./routes/transfers");
const dashboardRoutes = require("./routes/dashboard");
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/password", require("./routes/password"));

app.use("/api/cases", require("./routes/cases"));

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/evidence", evidenceRoutes);

app.use("/api/transfers", transfersRoutes);

app.use("/api/custody", require("./routes/custody"));

app.use("/uploads", express.static("uploads"));

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
