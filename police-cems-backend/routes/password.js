const router = require("express").Router();
const {
  sendResetLink,
  resetPassword
} = require("../controllers/password_controller");

router.post("/forgot", sendResetLink);
router.post("/reset", resetPassword);

module.exports = router;
