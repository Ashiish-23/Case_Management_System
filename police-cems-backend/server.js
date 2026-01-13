const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const app = express();
const dashboardRoutes = require("./routes/dashboard");
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});

app.use("/api/password", require("./routes/password"));

app.use("/api/cases", require("./routes/cases"));

app.use("/api/dashboard", require("./routes/dashboard"));

app.use("/api/evidence", require("./routes/evidence"));

app.use("/uploads", express.static("uploads"));