const User = require("../models/User");

/**
 * User Settings Controller
 * Manages user preferences, customization, and privacy settings
 */

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    const user = await User.findById(userId).select(
      "settings preferences privacySettings",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      settings: {
        defaultModel: user.settings?.defaultModel || "Groq-pro",
        useSearch: user.settings?.useSearch || false,
        temperature: user.settings?.temperature || 0.6,
        language: user.settings?.language || "en",
        theme: user.settings?.theme || "dark",
      },
      privacy: {
        encryptionEnabled: user.privacySettings?.encryptionEnabled ?? true,
        collectAnalytics: user.privacySettings?.collectAnalytics ?? true,
        dataRetentionDays: user.privacySettings?.dataRetentionDays || 365,
      },
      preferences: user.preferences || {},
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching settings", error: error.message });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    console.log("[UpdateSettings] Request received:", req.body);
    const userId = req.user._id || req.user.id || req.userId;
    const { 
      defaultModel, 
      useSearch, 
      temperature, 
      language, 
      theme,
      name,
      email,
      nickname,
      workType,
      preferences,
      notifications,
      // Privacy fields
      encryptionEnabled,
      collectAnalytics,
      dataRetentionDays
    } = req.body;

    const updateData = {};

    if (defaultModel) updateData["settings.defaultModel"] = defaultModel;
    if (useSearch !== undefined) updateData["settings.useSearch"] = useSearch;
    if (temperature !== undefined)
      updateData["settings.temperature"] = Math.max(
        0,
        Math.min(2, temperature),
      );
      if (name !== undefined) updateData["name"] = name;
      console.log("[UpdateSettings] Name:", name);
      if (email !== undefined) updateData["email"] = email;
      console.log("[UpdateSettings] Email:", email);
      if (nickname !== undefined) updateData["nickname"] = nickname;
      console.log("[UpdateSettings] Nickname:", nickname);
      if (workType !== undefined) updateData["workType"] = workType;
      console.log("[UpdateSettings] Work Type:", workType);
      if (preferences !== undefined) updateData["preferences"] = preferences;
      console.log("[UpdateSettings] Preferences:", preferences);
      if (notifications !== undefined) updateData["notifications"] = notifications;
      console.log("[UpdateSettings] Notifications:", notifications);
      if (language !== undefined) updateData["settings.language"] = language;
      console.log("[UpdateSettings] Language:", language);
      if (theme !== undefined) updateData["settings.theme"] = theme;
      console.log("[UpdateSettings] Theme:", theme);

      // Privacy updates
      if (encryptionEnabled !== undefined) updateData["privacySettings.encryptionEnabled"] = encryptionEnabled;
      if (collectAnalytics !== undefined) updateData["privacySettings.collectAnalytics"] = collectAnalytics;
      if (dataRetentionDays !== undefined) updateData["privacySettings.dataRetentionDays"] = dataRetentionDays;
      
      console.log("[UpdateSettings] Update data:", updateData);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating settings", error: error.message });
  }
};

// Update privacy settings
exports.updatePrivacy = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    const { encryptionEnabled, collectAnalytics, dataRetentionDays } = req.body;

    const updateData = {};

    if (encryptionEnabled !== undefined)
      updateData["privacySettings.encryptionEnabled"] = encryptionEnabled;
    if (collectAnalytics !== undefined)
      updateData["privacySettings.collectAnalytics"] = collectAnalytics;
    if (dataRetentionDays !== undefined)
      updateData["privacySettings.dataRetentionDays"] = dataRetentionDays;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    );

    res.json({
      success: true,
      message: "Privacy settings updated",
      privacy: user.privacySettings,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating privacy", error: error.message });
  }
};

// Set custom system prompt
exports.setSystemPrompt = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    const { systemPrompt } = req.body;

    if (!systemPrompt || systemPrompt.trim().length === 0) {
      return res.status(400).json({ message: "System prompt cannot be empty" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { "settings.systemPrompt": systemPrompt } },
      { new: true },
    );

    res.json({
      success: true,
      message: "System prompt updated",
      systemPrompt: user.settings.systemPrompt,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error setting system prompt", error: error.message });
  }
};

// Get system prompt
exports.getSystemPrompt = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    const user = await User.findById(userId).select("settings.systemPrompt");

    res.json({
      success: true,
      systemPrompt: user.settings?.systemPrompt || null,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching system prompt", error: error.message });
  }
};

// Request data export (for GDPR compliance)
exports.requestDataExport = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    // Mark for export in background job
    await User.findByIdAndUpdate(userId, {
      $set: { dataExportRequested: new Date() },
    });

    res.json({
      success: true,
      message:
        "Data export requested. You will receive an email within 24 hours.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error requesting data export", error: error.message });
  }
};

// Delete user account and all data
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ message: "Password required for account deletion" });
    }

    const user = await User.findById(userId);

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Delete user and associated chats
    const Chat = require("../models/Chat");
    await Chat.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "Account and all associated data deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting account", error: error.message });
  }
};

// Get usage statistics
exports.getUsageStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.userId;
    const Chat = require("../models/Chat");

    const chats = await Chat.find({ user: userId });
    const totalMessages = chats.reduce(
      (sum, chat) => sum + chat.messages.length,
      0,
    );
    const totalChats = chats.length;

    // Calculate approximate tokens (rough estimate: 1 token ≈ 4 characters)
    const totalTokens = Math.round(
      chats.reduce((sum, chat) => {
        return (
          sum +
          chat.messages.reduce(
            (msgSum, msg) => msgSum + msg.content.length / 4,
            0,
          )
        );
      }, 0),
    );

    res.json({
      success: true,
      stats: {
        totalChats,
        totalMessages,
        estimatedTokens: totalTokens,
        averageMessagesPerChat:
          totalChats > 0 ? Math.round(totalMessages / totalChats) : 0,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching usage stats", error: error.message });
  }
};

module.exports = exports;
