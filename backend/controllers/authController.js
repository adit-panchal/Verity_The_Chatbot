const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserService = require("../services/userService");
const { sendWelcomeEmail } = require("../utils/emailService");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide name, email, and password" });
    }

    email = email.toLowerCase().trim();
    password = String(password).trim();

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create new user
    const user = await UserService.create({
      name,
      email,
      password,
      role: "user",
      subscription: "free",
    });

    console.log(`[Auth] User registered: ${email}`);

    // Fire off the welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    if (user) {
      const token = generateToken(user.id);
      return res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        workType: user.work_type,
        nickname: user.nickname || "",
        notifications: user.notifications,
        preferences: user.preferences || "",
        token,
      });
    } else {
      return res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    return res
      .status(500)
      .json({ message: error.message || "Registration failed" });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Please add email and password" });
    }

    email = email.toLowerCase().trim();
    password = String(password).trim();

    console.log(`[Auth] Login Request - Email: '${email}'`);

    const user = await UserService.findByEmail(email);
    let isMatch = false;

    if (user) {
      isMatch = await UserService.comparePassword(password, user.password);
    } else {
      console.log(`[Auth] User NOT found for email: ${email}`);
    }

    if (isMatch) {
      console.log(`[Auth] Login successful: ${email}`);
      const token = generateToken(user.id);
      return res.status(200).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        workType: user.work_type,
        nickname: user.nickname || "",
        notifications: user.notifications,
        preferences: user.preferences || "",
        token,
      });
    }

    console.log(`[Auth] Login failed: ${email} (Invalid credentials)`);
    return res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return res.status(500).json({ message: error.message || "Login failed" });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await UserService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      workType: user.work_type,
      nickname: user.nickname || "",
      notifications: user.notifications,
      preferences: user.preferences || "",
    });
  } catch (error) {
    console.error("[Auth] Get me error:", error);
    res.status(500).json({ message: error.message || "Failed to get user" });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    console.log("[UpdateProfile] Request received with body:", req.body);
    console.log("[UpdateProfile] User ID:", req.user?.id);

    const user = await UserService.findById(req.user.id);
    console.log("[UpdateProfile] User found:", !!user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.email !== undefined)
      updateData.email = req.body.email.toLowerCase();
    if (req.body.work_type !== undefined) updateData.work_type = req.body.work_type;
    if (req.body.workType !== undefined) updateData.work_type = req.body.workType;
    if (req.body.nickname !== undefined) updateData.nickname = req.body.nickname;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.subscription !== undefined)
      updateData.subscription = req.body.subscription;
    if (req.body.notifications !== undefined)
      updateData.notifications = req.body.notifications;
    if (req.body.preferences !== undefined)
      updateData.preferences = req.body.preferences;
    if (req.body.password !== undefined) {
      // Password will be hashed by UserService
      updateData.password = req.body.password;
    }

    // Update user
    const updatedUser = await UserService.update(req.user.id, updateData);

    console.log("[UpdateProfile] User updated successfully");

    res.status(200).json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      subscription: updatedUser.subscription,
      workType: updatedUser.work_type,
      nickname: updatedUser.nickname || "",
      notifications: updatedUser.notifications,
      preferences: updatedUser.preferences || "",
      token: generateToken(updatedUser.id),
    });
  } catch (error) {
    console.error("[UpdateProfile] Error:", error);
    res.status(500).json({ message: error.message || "Update failed" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
};
