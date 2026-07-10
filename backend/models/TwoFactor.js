const mongoose = require("mongoose");
const crypto = require("crypto");

const twoFactorSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // 2FA Method: 'email', 'totp', or 'none'
    method: {
      type: String,
      enum: ["none", "email", "totp"],
      default: "none",
    },
    // TOTP Secret (encrypted)
    totpSecret: {
      type: String,
      default: null,
    },
    // Backup codes (hashed)
    backupCodes: [
      {
        code: String,
        used: {
          type: Boolean,
          default: false,
        },
        usedAt: Date,
      },
    ],
    // Email OTP storage
    emailOTP: {
      code: String,
      expiresAt: Date,
      attempts: {
        type: Number,
        default: 0,
      },
    },
    // Failed attempts tracking
    failedAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    // Trusted devices
    trustedDevices: [
      {
        deviceId: String,
        deviceName: String,
        userAgent: String,
        ip: String,
        trustedUntil: Date,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Last verified timestamp
    lastVerified: Date,
  },
  {
    timestamps: true,
  }
);

// Method to check if account is locked
twoFactorSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

// Method to increment failed attempts
twoFactorSchema.methods.incrementFailedAttempts = async function () {
  this.failedAttempts += 1;

  // Lock account after 5 failed attempts for 15 minutes
  if (this.failedAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }

  await this.save();
};

// Method to reset failed attempts
twoFactorSchema.methods.resetFailedAttempts = async function () {
  this.failedAttempts = 0;
  this.lockedUntil = null;
  await this.save();
};

// Method to verify backup code
twoFactorSchema.methods.verifyBackupCode = function (code) {
  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  const backupCode = this.backupCodes.find(
    (bc) => bc.code === hashedCode && !bc.used
  );

  if (backupCode) {
    backupCode.used = true;
    backupCode.usedAt = new Date();
    return true;
  }

  return false;
};

// Method to generate backup codes
twoFactorSchema.methods.generateBackupCodes = function (count = 10) {
  const codes = [];
  this.backupCodes = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);

    // Store hashed version
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
    this.backupCodes.push({
      code: hashedCode,
      used: false,
    });
  }

  return codes; // Return plain codes to show user once
};

// Method to check if device is trusted
twoFactorSchema.methods.isDeviceTrusted = function (deviceId) {
  const device = this.trustedDevices.find(
    (d) => d.deviceId === deviceId && d.trustedUntil > Date.now()
  );
  return !!device;
};

// Method to add trusted device
twoFactorSchema.methods.addTrustedDevice = function (
  deviceId,
  deviceName,
  userAgent,
  ip,
  days = 30
) {
  // Remove existing device with same ID
  this.trustedDevices = this.trustedDevices.filter(
    (d) => d.deviceId !== deviceId
  );

  // Add new trusted device
  this.trustedDevices.push({
    deviceId,
    deviceName,
    userAgent,
    ip,
    trustedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });
};

module.exports = mongoose.model("TwoFactor", twoFactorSchema);
