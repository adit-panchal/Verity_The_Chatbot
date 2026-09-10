// Stub model for Supabase migration
// All security logging should use Supabase directly

const supabase = require("../config/supabase");

const SecurityLog = {
  logEvent: async (userId, eventType, success, req, metadata = {}) => {
    try {
      const { error } = await supabase.from("security_logs").insert([
        {
          user_id: userId,
          event_type: eventType,
          success,
          ip_address: req.ip || req.connection?.remoteAddress || "unknown",
          user_agent: req.headers["user-agent"] || "unknown",
          metadata: JSON.stringify(metadata),
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("[SecurityLog] Error logging event:", error);
      }
    } catch (error) {
      console.error("[SecurityLog] Error in logEvent:", error);
    }
  },

  find: async (query) => {
    try {
      const { data, error } = await supabase
        .from("security_logs")
        .select("*")
        .match(query)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[SecurityLog] Error in find:", error);
      throw error;
    }
  },
};

module.exports = SecurityLog;
