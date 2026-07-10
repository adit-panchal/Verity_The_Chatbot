const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const settingsController = require("../controllers/settingsController");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Settings routes
router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);

// Privacy routes
router.put("/privacy", settingsController.updatePrivacy);

// System prompt routes
router.post("/system-prompt", settingsController.setSystemPrompt);
router.get("/system-prompt", settingsController.getSystemPrompt);

// Data management
router.post("/export-data", settingsController.requestDataExport);
router.delete("/delete-account", settingsController.deleteAccount);

// Usage statistics
router.get("/usage/stats", settingsController.getUsageStats);

module.exports = router;
