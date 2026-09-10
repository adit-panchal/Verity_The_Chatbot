const UserService = require("../services/userService");
const supabase = require("../config/supabase");

/**
 * User Settings Controller
 * Manages user preferences, customization, and privacy settings
 */

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await UserService.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      settings: {
        defaultModel: user.default_model || "Groq-pro",
        useSearch: user.use_search || false,
        temperature: user.temperature || 0.6,
        language: user.language || "en",
        theme: user.theme || "dark",
      },
      privacy: {
        encryptionEnabled: user.encryption_enabled ?? true,
        collectAnalytics: user.collect_analytics ?? true,
        dataRetentionDays: user.data_retention_days || 365,
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
    const userId = req.user.id || req.user._id;
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
      encryptionEnabled,
      collectAnalytics,
      dataRetentionDays,
    } = req.body;

    const updateData = {};

    if (defaultModel) updateData.default_model = defaultModel;
    if (useSearch !== undefined) updateData.use_search = useSearch;
    if (temperature !== undefined)
      updateData.temperature = Math.max(0, Math.min(2, temperature));
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (nickname !== undefined) updateData.nickname = nickname;
    if (workType !== undefined) updateData.work_type = workType;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (notifications !== undefined) updateData.notifications = notifications;
    if (language !== undefined) updateData.language = language;
    if (theme !== undefined) updateData.theme = theme;
    if (encryptionEnabled !== undefined)
      updateData.encryption_enabled = encryptionEnabled;
    if (collectAnalytics !== undefined)
      updateData.collect_analytics = collectAnalytics;
    if (dataRetentionDays !== undefined)
      updateData.data_retention_days = dataRetentionDays;

    console.log("[UpdateSettings] Update data:", updateData);

    const user = await UserService.update(userId, updateData);

    res.json({
      success: true,
      settings: user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating settings", error: error.message });
  }
};

// Update privacy settings
exports.updatePrivacy = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { encryptionEnabled, collectAnalytics, dataRetentionDays } = req.body;

    const updateData = {};

    if (encryptionEnabled !== undefined)
      updateData.encryption_enabled = encryptionEnabled;
    if (collectAnalytics !== undefined)
      updateData.collect_analytics = collectAnalytics;
    if (dataRetentionDays !== undefined)
      updateData.data_retention_days = dataRetentionDays;

    const user = await UserService.update(userId, updateData);

    res.json({
      success: true,
      message: "Privacy settings updated",
      privacy: {
        encryptionEnabled: user.encryption_enabled,
        collectAnalytics: user.collect_analytics,
        dataRetentionDays: user.data_retention_days,
      },
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
    const userId = req.user.id || req.user._id;
    const { systemPrompt } = req.body;

    if (!systemPrompt || systemPrompt.trim().length === 0) {
      return res.status(400).json({ message: "System prompt cannot be empty" });
    }

    const user = await UserService.update(userId, {
      system_prompt: systemPrompt,
    });

    res.json({
      success: true,
      message: "System prompt updated",
      systemPrompt: user.system_prompt,
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
    const userId = req.user.id || req.user._id;
    const user = await UserService.findById(userId);

    res.json({
      success: true,
      systemPrompt: user?.system_prompt || null,
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
    const userId = req.user.id || req.user._id;
    await UserService.update(userId, {
      data_export_requested: new Date().toISOString(),
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
    const userId = req.user.id || req.user._id;
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ message: "Password required for account deletion" });
    }

    const user = await UserService.findByEmail(req.user.email);

    // Verify password
    const isMatch = await UserService.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Delete user and associated chats
    const { error: chatError } = await supabase
      .from("chats")
      .delete()
      .eq("user_id", userId);

    if (chatError) {
      throw chatError;
    }

    await UserService.delete(userId);

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
    const userId = req.user.id || req.user._id;

    const { data: chats, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    const totalChats = chats?.length || 0;
    const totalMessages = chats?.reduce(
      (sum, chat) => sum + (chat.messages?.length || 0),
      0
    ) || 0;

    // Calculate approximate tokens (rough estimate: 1 token ≈ 4 characters)
    const totalTokens = Math.round(
      chats?.reduce((sum, chat) => {
        return (
          sum +
          (chat.messages?.reduce(
            (msgSum, msg) => msgSum + (msg.content?.length || 0) / 4,
            0
          ) || 0)
        );
      }, 0) || 0
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
