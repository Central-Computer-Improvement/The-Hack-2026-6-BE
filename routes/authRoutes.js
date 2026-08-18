const express = require("express");
const router = express.Router();
const { login, googleLogin, logout } = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", requireAuth, logout);
module.exports = router;