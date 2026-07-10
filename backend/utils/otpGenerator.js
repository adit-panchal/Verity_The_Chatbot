const crypto = require('crypto');

/**
 * Generate 6-digit OTP for email verification
 */
exports.generateEmailOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate unique device ID based on user agent and IP
 */
exports.generateDeviceId = (userAgent, ip) => {
  const timestamp = Date.now();
  return crypto
    .createHash('sha256')
    .update(`${userAgent}-${ip}-${timestamp}`)
    .digest('hex')
    .substring(0, 32);
};

/**
 * Hash backup code for secure storage
 */
exports.hashBackupCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

/**
 * Generate random backup code (8 characters)
 */
exports.generateBackupCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Check if OTP is expired
 */
exports.isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Get OTP expiry time (default 10 minutes)
 */
exports.getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
