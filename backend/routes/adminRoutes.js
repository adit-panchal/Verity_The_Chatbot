const express = require("express");
const router = express.Router();
const { getAdminStats } = require("../controllers/adminController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

// Both 'protect' AND 'isAdmin' must pass for this route to run
router.get("/stats", protect, isAdmin, getAdminStats);

module.exports = router;