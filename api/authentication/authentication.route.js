const express = require("express");
const authMiddleware = require("../../middlewares/authentication.middleware");
const {
  login,
  logout,
  refreshToken,
  requestResetPassword,
  resetPassword,
  verifyResetPassword,
} = require("./authentication.controller");

const router = express.Router();

router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", authMiddleware, logout);
router.post("/reset-password/request", requestResetPassword);
router.post("/reset-password/verify", verifyResetPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
