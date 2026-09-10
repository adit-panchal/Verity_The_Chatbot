const UserService = require("../services/userService");
const supabase = require("../config/supabase");

// @desc    Toggle End-to-End Encryption
// @route   POST /api/privacy/encryption/toggle
// @access  Private
const toggleEncryption = async (req, res) => {
  try {
    const user = await UserService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newEncryptionState = !user.encryption_enabled;
    await UserService.update(req.user.id, {
      encryption_enabled: newEncryptionState,
    });

    res.status(200).json({
      encryptionEnabled: newEncryptionState,
      message: `Encryption ${newEncryptionState ? "Enabled" : "Disabled"}`,
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
    const user = await UserService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { data: chats, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", req.user.id);

    if (error) {
      throw error;
    }

    const exportData = {
      userProfile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        created_at: user.created_at,
      },
      chatHistory: chats || [],
      exportDate: new Date().toISOString(),
      format: "JSON",
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
    const userId = req.user.id;

    // Delete associated chats
    const { error: chatError } = await supabase
      .from("chats")
      .delete()
      .eq("user_id", userId);

    if (chatError) {
      throw chatError;
    }

    // Delete user
    await UserService.delete(userId);

    res
      .status(200)
      .json({ message: "Account and data permanently deleted." });
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
    await UserService.update(req.user.id, {
      data_retention_days: days,
    });

    res.status(200).json({
      dataRetentionDays: days,
      message: "Retention policy updated",
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
      return res
        .status(400)
        .json({
          message: "Please provide both current and new password",
        });
    }

    // Check new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long",
      });
    }

    // Find user
    const user = await UserService.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await UserService.comparePassword(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password (will be hashed by UserService)
    await UserService.update(req.user.id, {
      password: newPassword,
    });

    res.status(200).json({
      message: "Password updated successfully",
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
  updatePassword,
};
