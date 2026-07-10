const TwoFactor = require("../models/TwoFactor");
const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");
const {
  generateEmailOTP,
  generateDeviceId,
  isOTPExpired,
  getOTPExpiry,
} = require("../utils/otpGenerator");
const {
  sendOTPEmail,
  send2FAEnabledAlert,
  send2FADisabledAlert,
  sendBackupCodesEmail,
} = require("../utils/emailService");

// @desc    Enable 2FA with Email OTP
// @route   POST /api/2fa/enable
// @access  Private
exports.enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is already enabled" });
    }

    // Create or update TwoFactor record
    let twoFactor = await TwoFactor.findOne({ user: userId });

    if (!twoFactor) {
      twoFactor = new TwoFactor({
        user: userId,
        method: "email",
      });
    } else {
      twoFactor.method = "email";
    }

    // Generate backup codes
    const backupCodes = twoFactor.generateBackupCodes(10);
    await twoFactor.save();

    // Update user
    user.twoFactorEnabled = true;
    user.twoFactorMethod = "email";
    await user.save();

    // Send email notification
    await send2FAEnabledAlert(user.email, user.name);

    // Send backup codes via email
    await sendBackupCodesEmail(user.email, user.name, backupCodes);

    // Log security event
    await SecurityLog.logEvent(userId, "2fa_enabled", true, req, {
      method: "email",
    });

    res.status(200).json({
      message: "Two-Factor Authentication enabled successfully",
      method: "email",
      backupCodes, // Return once for user to save
    });
  } catch (error) {
    console.error("Enable 2FA error:", error);
    res.status(500).json({ message: "Failed to enable 2FA" });
  }
};

// @desc    Disable 2FA
// @route   POST /api/2fa/disable
// @access  Private
exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verify password before disabling
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    // Update user
    user.twoFactorEnabled = false;
    user.twoFactorMethod = "none";
    await user.save();

    // Update TwoFactor record
    const twoFactor = await TwoFactor.findOne({ user: userId });
    if (twoFactor) {
      twoFactor.method = "none";
      twoFactor.emailOTP = undefined;
      twoFactor.backupCodes = [];
      twoFactor.trustedDevices = [];
      await twoFactor.save();
    }

    // Send email notification
    await send2FADisabledAlert(user.email, user.name);

    // Log security event
    await SecurityLog.logEvent(userId, "2fa_disabled", true, req);

    res.status(200).json({
      message: "Two-Factor Authentication disabled successfully",
    });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    res.status(500).json({ message: "Failed to disable 2FA" });
  }
};

// @desc    Send OTP to user's email (during login)
// @route   POST /api/2fa/send-otp
// @access  Public (but requires valid email/password first)
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        message: "If 2FA is enabled, an OTP has been sent to your email",
      });
    }

    if (!user.twoFactorEnabled || user.twoFactorMethod !== "email") {
      return res.status(200).json({
        message: "If 2FA is enabled, an OTP has been sent to your email",
      });
    }

    const twoFactor = await TwoFactor.findOne({ user: user._id });

    if (!twoFactor) {
      return res.status(500).json({ message: "2FA configuration not found" });
    }

    // Check if account is locked
    if (twoFactor.isLocked()) {
      const lockTime = Math.ceil(
        (twoFactor.lockedUntil - Date.now()) / 1000 / 60
      );
      return res.status(429).json({
        message: `Account temporarily locked. Try again in ${lockTime} minutes`,
        lockedUntil: twoFactor.lockedUntil,
      });
    }

    // Generate OTP
    const otp = generateEmailOTP();
    const expiresAt = getOTPExpiry(10); // 10 minutes

    // Save OTP
    twoFactor.emailOTP = {
      code: otp,
      expiresAt,
      attempts: 0,
    };
    await twoFactor.save();

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.name);

    // Log event
    await SecurityLog.logEvent(user._id, "2fa_otp_sent", true, req, {
      method: "email",
    });

    res.status(200).json({
      message: "Verification code sent to your email",
      expiresIn: 600, // seconds
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Failed to send verification code" });
  }
};

// @desc    Verify OTP (during login)
// @route   POST /api/2fa/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp, trustDevice } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const twoFactor = await TwoFactor.findOne({ user: user._id });

    if (!twoFactor) {
      return res.status(500).json({ message: "2FA configuration not found" });
    }

    // Check if account is locked
    if (twoFactor.isLocked()) {
      const lockTime = Math.ceil(
        (twoFactor.lockedUntil - Date.now()) / 1000 / 60
      );
      return res.status(429).json({
        message: `Account temporarily locked. Try again in ${lockTime} minutes`,
      });
    }

    // Check if OTP exists
    if (!twoFactor.emailOTP || !twoFactor.emailOTP.code) {
      return res.status(400).json({ message: "No OTP found. Please request a new one" });
    }

    // Check if OTP is expired
    if (isOTPExpired(twoFactor.emailOTP.expiresAt)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one" });
    }

    // Verify OTP
    if (twoFactor.emailOTP.code !== otp) {
      // Increment failed attempts
      await twoFactor.incrementFailedAttempts();

      // Log failed attempt
      await SecurityLog.logEvent(user._id, "2fa_verified_failed", false, req, {
        method: "email",
        reason: "invalid_otp",
      });

      return res.status(401).json({
        message: "Invalid verification code",
        attemptsRemaining: Math.max(0, 5 - twoFactor.failedAttempts),
      });
    }

    // OTP is valid - reset failed attempts
    await twoFactor.resetFailedAttempts();

    // Clear used OTP
    twoFactor.emailOTP = undefined;
    twoFactor.lastVerified = new Date();

    // Handle device trust
    let deviceId = null;
    if (trustDevice) {
      const userAgent = req.headers["user-agent"] || "unknown";
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      deviceId = generateDeviceId(userAgent, ip);

      twoFactor.addTrustedDevice(
        deviceId,
        "Web Browser", // You can parse user agent for better name
        userAgent,
        ip,
        30 // Trust for 30 days
      );

      await SecurityLog.logEvent(user._id, "2fa_device_trusted", true, req, {
        deviceId,
      });
    }

    await twoFactor.save();

    // Log successful verification
    await SecurityLog.logEvent(user._id, "2fa_verified_success", true, req, {
      method: "email",
    });

    res.status(200).json({
      message: "Verification successful",
      verified: true,
      deviceId,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// @desc    Verify backup code
// @route   POST /api/2fa/verify-backup
// @access  Public
exports.verifyBackupCode = async (req, res) => {
  try {
    const { email, backupCode } = req.body;

    if (!email || !backupCode) {
      return res.status(400).json({ message: "Email and backup code are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const twoFactor = await TwoFactor.findOne({ user: user._id });

    if (!twoFactor) {
      return res.status(500).json({ message: "2FA configuration not found" });
    }

    // Check if account is locked
    if (twoFactor.isLocked()) {
      const lockTime = Math.ceil(
        (twoFactor.lockedUntil - Date.now()) / 1000 / 60
      );
      return res.status(429).json({
        message: `Account temporarily locked. Try again in ${lockTime} minutes`,
      });
    }

    // Verify backup code
    const isValid = twoFactor.verifyBackupCode(backupCode);

    if (!isValid) {
      await twoFactor.incrementFailedAttempts();

      await SecurityLog.logEvent(user._id, "2fa_verified_failed", false, req, {
        method: "backup_code",
        reason: "invalid_code",
      });

      return res.status(401).json({
        message: "Invalid backup code",
        attemptsRemaining: Math.max(0, 5 - twoFactor.failedAttempts),
      });
    }

    // Backup code is valid
    await twoFactor.resetFailedAttempts();
    await twoFactor.save();

    // Log successful verification
    await SecurityLog.logEvent(user._id, "2fa_backup_code_used", true, req);

    res.status(200).json({
      message: "Backup code verified successfully",
      verified: true,
      warning: "This backup code has been used and cannot be used again",
    });
  } catch (error) {
    console.error("Verify backup code error:", error);
    res.status(500).json({ message: "Failed to verify backup code" });
  }
};

// @desc    Generate new backup codes
// @route   POST /api/2fa/backup-codes/regenerate
// @access  Private
exports.regenerateBackupCodes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verify password
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: "2FA is not enabled" });
    }

    const twoFactor = await TwoFactor.findOne({ user: userId });

    if (!twoFactor) {
      return res.status(500).json({ message: "2FA configuration not found" });
    }

    // Generate new backup codes
    const backupCodes = twoFactor.generateBackupCodes(10);
    await twoFactor.save();

    // Send via email
    await sendBackupCodesEmail(user.email, user.name, backupCodes);

    // Log event
    await SecurityLog.logEvent(userId, "2fa_backup_codes_generated", true, req);

    res.status(200).json({
      message: "New backup codes generated successfully",
      backupCodes,
    });
  } catch (error) {
    console.error("Regenerate backup codes error:", error);
    res.status(500).json({ message: "Failed to generate backup codes" });
  }
};

// @desc    Get 2FA status
// @route   GET /api/2fa/status
// @access  Private
exports.get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const twoFactor = await TwoFactor.findOne({ user: userId });

    const status = {
      enabled: user.twoFactorEnabled,
      method: user.twoFactorMethod,
      backupCodesRemaining: 0,
      trustedDevices: [],
    };

    if (twoFactor) {
      status.backupCodesRemaining = twoFactor.backupCodes.filter(
        (bc) => !bc.used
      ).length;
      status.trustedDevices = twoFactor.trustedDevices
        .filter((d) => d.trustedUntil > Date.now())
        .map((d) => ({
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          createdAt: d.createdAt,
          expiresAt: d.trustedUntil,
        }));
    }

    res.status(200).json(status);
  } catch (error) {
    console.error("Get 2FA status error:", error);
    res.status(500).json({ message: "Failed to get 2FA status" });
  }
};

// @desc    Check if device is trusted
// @route   POST /api/2fa/check-device
// @access  Public
exports.checkTrustedDevice = async (req, res) => {
  try {
    const { email, deviceId } = req.body;

    if (!email || !deviceId) {
      return res.status(400).json({ message: "Email and device ID are required" });
    }

    const user = await User.findOne({ email });

    if (!user || !user.twoFactorEnabled) {
      return res.status(200).json({ trusted: false });
    }

    const twoFactor = await TwoFactor.findOne({ user: user._id });

    if (!twoFactor) {
      return res.status(200).json({ trusted: false });
    }

    const isTrusted = twoFactor.isDeviceTrusted(deviceId);

    res.status(200).json({ trusted: isTrusted });
  } catch (error) {
    console.error("Check trusted device error:", error);
    res.status(500).json({ message: "Failed to check device" });
  }
};

// @desc    Remove trusted device
// @route   DELETE /api/2fa/trusted-device/:deviceId
// @access  Private
exports.removeTrustedDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.params;

    const twoFactor = await TwoFactor.findOne({ user: userId });

    if (!twoFactor) {
      return res.status(404).json({ message: "2FA configuration not found" });
    }

    twoFactor.trustedDevices = twoFactor.trustedDevices.filter(
      (d) => d.deviceId !== deviceId
    );

    await twoFactor.save();

    await SecurityLog.logEvent(userId, "2fa_device_removed", true, req, {
      deviceId,
    });

    res.status(200).json({ message: "Device removed successfully" });
  } catch (error) {
    console.error("Remove trusted device error:", error);
    res.status(500).json({ message: "Failed to remove device" });
  }
};
