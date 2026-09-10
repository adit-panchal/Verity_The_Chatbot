// Stub model for Supabase migration
// All 2FA operations should use Supabase directly

const supabase = require("../config/supabase");

const TwoFactor = {
  findOne: async (query) => {
    try {
      const { data, error } = await supabase
        .from("two_factor")
        .select("*")
        .match(query)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("[TwoFactor] Error in findOne:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const { data: result, error } = await supabase
        .from("two_factor")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error("[TwoFactor] Error in create:", error);
      throw error;
    }
  },

  updateOne: async (query, updateData) => {
    try {
      const { data, error } = await supabase
        .from("two_factor")
        .update(updateData)
        .match(query)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("[TwoFactor] Error in updateOne:", error);
      throw error;
    }
  },
};

module.exports = TwoFactor;
