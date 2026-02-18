const express = require("express");
const router = express.Router();

const auth = require("../../middleware/authMiddleware");
const requireAdmin = require("../../middleware/adminMiddleware");

const statsRoutes = require("./stats");
const usersRoutes = require("./users");
const casesRoutes = require("./cases");
const stationsRoutes = require("./stations");
const evidenceRoutes = require("./evidence");
const transfersRoutes = require("./transfers");
const auditRoutes = require("./audit");

/* Mount submodules */

router.use("/stats", auth, requireAdmin, statsRoutes);
router.use("/users", auth, requireAdmin, usersRoutes);
router.use("/cases", auth, requireAdmin, casesRoutes);
router.use("/stations", auth, requireAdmin, stationsRoutes);
router.use("/evidence", auth, requireAdmin, evidenceRoutes);
router.use("/transfers", auth, requireAdmin, transfersRoutes);
router.use("/audit", auth, requireAdmin, auditRoutes);

module.exports = router;
