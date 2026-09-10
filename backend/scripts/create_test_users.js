require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import User model
const User = require("../models/User");

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Create test users
const createTestUsers = async () => {
  try {
    // Delete existing test users
    await User.deleteMany({
      email: { $in: ["user@test.com", "admin@test.com"] },
    });
    console.log("Cleaned up existing test users");

    // Create normal user
    const normalUser = new User({
      name: "Test User",
      email: "user@test.com",
      password: "password123", // Will be hashed by the model's pre-save hook
      role: "user",
      workType: "Engineering",
      subscription: "free",
    });
    await normalUser.save();
    console.log("✓ Created normal user: user@test.com / password123");

    // Create admin user
    const adminUser = new User({
      name: "Admin User",
      email: "admin@test.com",
      password: "admin123", // Will be hashed by the model's pre-save hook
      role: "admin",
      workType: "Engineering",
      subscription: "enterprise",
    });
    await adminUser.save();
    console.log("✓ Created admin user: admin@test.com / admin123");

    console.log("\n✓ Test users created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating test users:", error);
    process.exit(1);
  }
};

// Run the script
connectDB().then(createTestUsers);
