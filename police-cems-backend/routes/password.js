// Password reset endpoints (send link, apply reset).
const router = require("express").Router();
const {
  sendResetLink,
  resetPassword
} = require("../controllers/password_controller");

// Request a reset link for a known email.
router.post("/forgot", sendResetLink);
// Reset password using the emailed token.
router.post("/reset", resetPassword);

module.exports = router;
