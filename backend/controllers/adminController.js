const supabase = require("../config/supabase");

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    // 1. Get total users count
    const { data: usersData, count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // 2. Get total chats count
    const { data: chatsData, count: totalChats } = await supabase
      .from("chats")
      .select("*", { count: "exact", head: true });

    // 3. Get users grouped by role
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, role, subscription, name, email, created_at");

    const usersByRole = {};
    allUsers?.forEach((user) => {
      const role = user.role || "user";
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    });

    // 4. Get users grouped by subscription
    const usersBySubscription = {};
    allUsers?.forEach((user) => {
      const subscription = user.subscription || "free";
      usersBySubscription[subscription] =
        (usersBySubscription[subscription] || 0) + 1;
    });

    // 5. Get 5 newest users
    const recentUsers = allUsers
      ?.sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      )
      .slice(0, 5)
      .map((user) => ({
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        createdAt: user.created_at,
      })) || [];

    // Send everything back to the frontend
    res.status(200).json({
      totalUsers: totalUsers || 0,
      totalChats: totalChats || 0,
      usersByRole: Object.entries(usersByRole).map(([role, count]) => ({
        _id: role,
        count,
      })),
      usersBySubscription: Object.entries(usersBySubscription).map(
        ([subscription, count]) => ({
          _id: subscription,
          count,
        })
      ),
      recentUsers,
    });
  } catch (error) {
    console.error("[AdminController] Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching admin statistics" });
  }
};

module.exports = { getAdminStats };
