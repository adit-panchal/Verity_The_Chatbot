const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendWelcomeEmail } = require("../utils/emailService");

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  let { name, email, password } = req.body;
  email = email.toLowerCase().trim();

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    console.log(`[Auth] Registration failed: User already exists (${email})`);
    res.status(400);
    throw new Error("User already exists");
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: "user", // Default role for new users
    subscription: "free", // Default subscription plan
  });

  if (user) {
    // Fire off the welcome email!
    // We don't use 'await' here so the user doesn't have to wait for the email to send before the UI loads
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      workType: user.workType,
      nickname: user.nickname,
      notifications: user.notifications,
      preferences: user.preferences,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase().trim();

  console.log(`[Auth] Login Request - Email: '${email}'`);

  // Check for user email
  const user = await User.findOne({ email }).select("+password");
  let isMatch = false;

  if (user) {
    isMatch = await user.matchPassword(password);
  } else {
    console.log(`[Auth] User NOT found for email: ${email}`);
  }

  if (isMatch) {
    console.log(`[Auth] Login successful: ${email}`);
    const token = generateToken(user._id);
    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      workType: user.workType,
      nickname: user.nickname,
      notifications: user.notifications,
      preferences: user.preferences,
      token,
    });
  } else {
    console.log(`[Auth] Login failed: ${email} (Invalid credentials)`);
    res.status(401);
    throw new Error("Invalid credentials");
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    console.log("[UpdateProfile] Request received with body:", req.body);
    console.log("[UpdateProfile] User ID:", req.user?._id);

    const user = await User.findById(req.user._id);
    console.log("[UpdateProfile] User found:", !!user);

    if (user) {
      user.name = req.body.name !== undefined ? req.body.name : user.name;
      user.email = req.body.email !== undefined ? req.body.email : user.email;
      user.workType =
        req.body.workType !== undefined ? req.body.workType : user.workType;
      user.nickname =
        req.body.nickname !== undefined ? req.body.nickname : user.nickname;
      user.role = req.body.role !== undefined ? req.body.role : user.role;
      user.subscription =
        req.body.subscription !== undefined
          ? req.body.subscription
          : user.subscription; // <-- Allow subscription updates
      user.notifications =
        req.body.notifications !== undefined
          ? req.body.notifications
          : user.notifications;
      user.preferences =
        req.body.preferences !== undefined
          ? req.body.preferences
          : user.preferences;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      console.log("[UpdateProfile] User saved successfully");

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        subscription: updatedUser.subscription, // <-- Added to update response
        workType: updatedUser.workType,
        nickname: updatedUser.nickname,
        notifications: updatedUser.notifications,
        preferences: updatedUser.preferences,
        token: generateToken(updatedUser._id),
      });
    } else {
      console.log("[UpdateProfile] User not found");
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("[UpdateProfile Error]:", error);
    res.status(500).json({ message: error.message });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateUserProfile,
};
