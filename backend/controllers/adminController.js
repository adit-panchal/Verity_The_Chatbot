const User = require("../models/User");
const Chat = require("../models/Chat");

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    // 1. Basic Counts
    const totalUsers = await User.countDocuments();
    const totalChats = await Chat.countDocuments();
    
    // 2. Group users by their roles (free, pro, admin)
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // 3. Group users by their subscription tier
    const usersBySubscription = await User.aggregate([
      { $group: { _id: "$subscription", count: { $sum: 1 } } }
    ]);

    // 4. Get the 5 newest users who signed up
    const recentUsers = await User.find()
      .select('name email role subscription createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Send everything back to the frontend
    res.status(200).json({
      totalUsers,
      totalChats,
      usersByRole,
      usersBySubscription,
      recentUsers
    });
  } catch (error) {
    console.error("[AdminController] Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching admin statistics" });
  }
};

module.exports = { getAdminStats };