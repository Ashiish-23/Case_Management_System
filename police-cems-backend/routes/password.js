const router = require("express").Router();

const {
  sendResetLink,
  resetPassword
} = require("../controllers/password_controller");

// MATCH FRONTEND
router.post("/forgot-password", sendResetLink);

// Already correct
router.post("/reset", resetPassword);

module.exports = router;
