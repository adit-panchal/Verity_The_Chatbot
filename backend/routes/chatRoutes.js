const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const {
  getChats,
  sendMessage,
  getChatById,
  deleteChat,
  clearChats,
  renameChat,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

// 👉 IMPORT YOUR NEW RATE LIMITER
const { chatLimiter } = require("../middleware/rateLimiter");

// Custom middleware for handling multer errors
const uploadMiddleware = (req, res, next) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) {
      console.error("[Multer Error]", err.message);
      return res
        .status(400)
        .json({ message: `File upload error: ${err.message}` });
    }
    next();
  });
};

router
  .route("/")
  .get(protect, getChats)
  // 👉 ADDED chatLimiter BEFORE file uploads and message processing
  .post(protect, chatLimiter, uploadMiddleware, sendMessage)
  .delete(protect, clearChats);

router
  .route("/:id")
  .get(protect, getChatById)
  .put(protect, renameChat)
  .delete(protect, deleteChat);

module.exports = router;
