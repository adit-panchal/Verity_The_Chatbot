const mongoose = require("mongoose");

const securityLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "2fa_enabled",
        "2fa_disabled",
        "2fa_verified_success",
        "2fa_verified_failed",
        "2fa_otp_sent",
        "2fa_backup_code_used",
        "2fa_backup_codes_generated",
        "2fa_account_locked",
        "2fa_device_trusted",
        "2fa_device_removed",
      ],
    },
    method: {
      type: String,
      enum: ["email", "totp", "backup_code", "none"],
      default: "none",
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    success: {
      type: Boolean,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
securityLogSchema.index({ user: 1, timestamp: -1 });
securityLogSchema.index({ action: 1, timestamp: -1 });

// Static method to log security event
securityLogSchema.statics.logEvent = async function (
  userId,
  action,
  success,
  req,
  metadata = {}
) {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await this.create({
      user: userId,
      action,
      success,
      ip,
      userAgent,
      metadata,
    });
  } catch (error) {
    console.error("Error logging security event:", error);
  }
};

module.exports = mongoose.model("SecurityLog", securityLogSchema);
