// Stub model for Supabase migration
// This file is kept for backward compatibility
// All chat operations should use Supabase directly

const supabase = require("../config/supabase");

// Mock mongoose-like interface for Chat model
const Chat = {
  find: async (query) => {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .match(query)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[Chat Model] Error in find:", error);
      throw error;
    }
  },

  findById: async (id) => {
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("[Chat Model] Error in findById:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const { data: result, error } = await supabase
        .from("chats")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error("[Chat Model] Error in create:", error);
      throw error;
    }
  },

  updateOne: async (query, data) => {
    try {
      const { data: result, error } = await supabase
        .from("chats")
        .update(data)
        .match(query)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error("[Chat Model] Error in updateOne:", error);
      throw error;
    }
  },

  deleteOne: async (query) => {
    try {
      const { error } = await supabase.from("chats").delete().match(query);

      if (error) throw error;
      return { deletedCount: 1 };
    } catch (error) {
      console.error("[Chat Model] Error in deleteOne:", error);
      throw error;
    }
  },

  deleteMany: async (query) => {
    try {
      const { error } = await supabase.from("chats").delete().match(query);

      if (error) throw error;
      return { deletedCount: 1 };
    } catch (error) {
      console.error("[Chat Model] Error in deleteMany:", error);
      throw error;
    }
  },
};

module.exports = Chat;
