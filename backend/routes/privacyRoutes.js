const express = require("express");
const router = express.Router();
const {
  toggleEncryption,
  exportUserData,
  deleteUserData,
  updateRetentionPolicy,
  updatePassword
} = require("../controllers/privacyController");
const { protect } = require("../middleware/authMiddleware");

router.post("/encryption/toggle", protect, toggleEncryption);
router.get("/data/export", protect, exportUserData);
router.post("/data/delete", protect, deleteUserData);
router.put("/retention-policy", protect, updateRetentionPolicy);
router.put("/password/update", protect, updatePassword);

module.exports = router;
