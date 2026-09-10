// Stub model for Supabase migration
// All user operations should use UserService instead of this model

const UserService = require("../services/userService");

// This is a stub to maintain backward compatibility
// DO NOT use this model directly - use UserService instead

const User = {
  findOne: async (query) => {
    try {
      if (query.email) {
        return UserService.findByEmail(query.email);
      }
      throw new Error("Use UserService.findByEmail() instead");
    } catch (error) {
      console.error("[User Model] Error:", error);
      throw error;
    }
  },

  findById: async (id) => {
    try {
      return UserService.findById(id);
    } catch (error) {
      console.error("[User Model] Error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      return UserService.create(data);
    } catch (error) {
      console.error("[User Model] Error:", error);
      throw error;
    }
  },

  find: async (query = {}) => {
    try {
      // For backward compatibility
      return UserService.getAllUsers();
    } catch (error) {
      console.error("[User Model] Error:", error);
      throw error;
    }
  },

  findByIdAndUpdate: async (id, update) => {
    try {
      // Extract the actual update data
      const updateData = update.$set || update;
      return UserService.update(id, updateData);
    } catch (error) {
      console.error("[User Model] Error:", error);
      throw error;
    }
  },

  findByIdAndDelete: async (id) => {
    try {
      return UserService.delete(id);
    } catch (error) {
      console.error("[User Model] Error:", error);
      throw error;
    }
  },

  countDocuments: async () => {
    try {
      const users = await UserService.getAllUsers();
      return users.length;
    } catch (error) {
      console.error("[User Model] Error:", error);
      throw error;
    }
  },
};

module.exports = User;
