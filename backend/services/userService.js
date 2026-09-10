const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");

class UserService {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found (not an error)
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("[UserService] Error finding user by email:", error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error("[UserService] Error finding user by ID:", error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            name: userData.name,
            email: userData.email.toLowerCase().trim(),
            password: hashedPassword,
            role: userData.role || "user",
            work_type: userData.workType || "Engineering",
            subscription: userData.subscription || "free",
            notifications: userData.notifications !== false,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("[UserService] Error creating user:", error);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async update(id, updateData) {
    try {
      // Hash password if it's being updated
      let dataToUpdate = { ...updateData };
      if (updateData.password) {
        const salt = await bcrypt.genSalt(10);
        dataToUpdate.password = await bcrypt.hash(updateData.password, salt);
      }

      const { data, error } = await supabase
        .from("users")
        .update(dataToUpdate)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("[UserService] Error updating user:", error);
      throw error;
    }
  }

  /**
   * Compare password with hashed password
   */
  static async comparePassword(plainPassword, hashedPassword) {
    try {
      // Support both bcrypt hashed and legacy plain-text passwords
      if (
        hashedPassword.startsWith("$2") ||
        hashedPassword.startsWith("$2a") ||
        hashedPassword.startsWith("$2b")
      ) {
        return await bcrypt.compare(plainPassword, hashedPassword);
      }

      // Legacy plain-text password support (not recommended)
      return plainPassword === hashedPassword;
    } catch (error) {
      console.error("[UserService] Error comparing passwords:", error);
      return false;
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, subscription, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("[UserService] Error getting all users:", error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  static async delete(id) {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error("[UserService] Error deleting user:", error);
      throw error;
    }
  }
}

module.exports = UserService;
