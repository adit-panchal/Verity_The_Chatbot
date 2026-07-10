const User = require("../models/User");
const Chat = require("../models/Chat");
// const crypto = require("crypto"); // For AES-256 encryption later

// @desc    Toggle End-to-End Encryption
// @route   POST /api/privacy/encryption/toggle
// @access  Private
const toggleEncryption = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    user.privacySettings.encryptionEnabled = !user.privacySettings.encryptionEnabled;
    await user.save();

    res.status(200).json({
      encryptionEnabled: user.privacySettings.encryptionEnabled,
      message: `Encryption ${user.privacySettings.encryptionEnabled ? 'Enabled' : 'Disabled'}`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export User Data (GDPR)
// @route   GET /api/privacy/data/export
// @access  Private
const exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const chats = await Chat.find({ user: req.user.id });

    const exportData = {
      userProfile: user,
      chatHistory: chats,
      exportDate: new Date().toISOString(),
      format: "JSON"
    };

    res.status(200).json(exportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete User Account & Data
// @route   POST /api/privacy/data/delete
// @access  Private
const deleteUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // In a real app, we might want to soft-delete first or require password confirmation
    // For this prototype, we'll delete chats then user
    await Chat.deleteMany({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({ message: "Account and data permanently deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Retention Policy
// @route   PUT /api/privacy/retention-policy
// @access  Private
const updateRetentionPolicy = async (req, res) => {
  const { days } = req.body;

  try {
    const user = await User.findById(req.user.id);
    user.privacySettings.dataRetentionDays = days;
    await user.save();

    res.status(200).json({ 
        dataRetentionDays: user.privacySettings.dataRetentionDays,
        message: "Retention policy updated" 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update User Password
// @route   PUT /api/privacy/password/update
// @access  Private
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide both current and new password" });
    }

    // Check new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    // Find user with password field
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ 
      message: "Password updated successfully" 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  toggleEncryption,
  exportUserData,
  deleteUserData,
  updateRetentionPolicy,
  updatePassword
};
