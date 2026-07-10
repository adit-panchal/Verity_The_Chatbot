const express = require("express");
const router = express.Router();
const {
  enable2FA,
  disable2FA,
  sendOTP,
  verifyOTP,
  verifyBackupCode,
  regenerateBackupCodes,
  get2FAStatus,
  checkTrustedDevice,
  removeTrustedDevice,
} = require("../controllers/twoFactorController");
const { protect } = require("../middleware/authMiddleware");

// Setup and configuration (Protected routes)
router.post("/enable", protect, enable2FA);
router.post("/disable", protect, disable2FA);

// OTP operations (Public - used during login)
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/verify-backup", verifyBackupCode);

// Backup codes (Protected)
router.post("/backup-codes/regenerate", protect, regenerateBackupCodes);

// Status and device management (Protected)
router.get("/status", protect, get2FAStatus);
router.post("/check-device", checkTrustedDevice);
router.delete("/trusted-device/:deviceId", protect, removeTrustedDevice);

module.exports = router;
