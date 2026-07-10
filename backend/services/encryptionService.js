const crypto = require("crypto");
const CryptoJS = require("crypto-js");

/**
 * Encryption Service - Provides data encryption and privacy utilities
 */

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-dev-key-change-in-production";

/**
 * Encrypt sensitive data
 */
const encrypt = (data) => {
  try {
    return CryptoJS.AES.encrypt(
      JSON.stringify(data),
      ENCRYPTION_KEY,
    ).toString();
  } catch (error) {
    console.error("[EncryptionService] Encryption failed:", error);
    throw error;
  }
};

/**
 * Decrypt sensitive data
 */
const decrypt = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("[EncryptionService] Decryption failed:", error);
    throw error;
  }
};

/**
 * Hash sensitive data (one-way)
 */
const hash = (data) => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Generate secure random token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Anonymize data - remove personally identifiable information
 */
const anonymizeData = (data) => {
  const anonymized = { ...data };

  // Remove/mask sensitive fields
  if (anonymized.email) {
    const [name, domain] = anonymized.email.split("@");
    anonymized.email = `${name.substring(0, 2)}***@${domain}`;
  }

  if (anonymized.ip) {
    const parts = anonymized.ip.split(".");
    anonymized.ip = `${parts[0]}.${parts[1]}.*.* `;
  }

  if (anonymized.phone) {
    anonymized.phone = `***${anonymized.phone.slice(-4)}`;
  }

  return anonymized;
};

/**
 * Data sanitization - remove unwanted content
 */
const sanitizeData = (data) => {
  if (typeof data === "string") {
    return data
      .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove scripts
      .replace(/on\w+\s*=/gi, "") // Remove event handlers
      .trim();
  }

  if (typeof data === "object") {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }

  return data;
};

/**
 * Validate encryption configuration
 */
const validateEncryptionSetup = () => {
  if (ENCRYPTION_KEY === "default-dev-key-change-in-production") {
    console.warn(
      "[EncryptionService] WARNING: Using default encryption key. Set ENCRYPTION_KEY env variable in production.",
    );
    return false;
  }
  return true;
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateToken,
  anonymizeData,
  sanitizeData,
  validateEncryptionSetup,
};
