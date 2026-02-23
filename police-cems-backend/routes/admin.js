const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const statsRoutes = require("./admin/stats");
const usersRoutes = require("./admin/users");
const casesRoutes = require("./admin/cases");
const stationsRoutes = require("./admin/stations");
const evidenceRoutes = require("./admin/evidence");
const transfersRoutes = require("./admin/transfers");

/* Mount submodules */

router.use("/stats", auth, requireAdmin, statsRoutes);
router.use("/users", auth, requireAdmin, usersRoutes);
router.use("/cases", auth, requireAdmin, casesRoutes);
router.use("/stations", auth, requireAdmin, stationsRoutes);
router.use("/evidence", auth, requireAdmin, evidenceRoutes);
router.use("/transfers", auth, requireAdmin, transfersRoutes);

module.exports = router;
