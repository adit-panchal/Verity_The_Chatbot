const jwt = require("jsonwebtoken");
const UserService = require("../services/userService");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      console.log("[AuthMiddleware] Token found");
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from Supabase
      const user = await UserService.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      // Attach user to request (without password)
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        work_type: user.work_type,
        nickname: user.nickname,
        notifications: user.notifications,
        preferences: user.preferences,
      };

      return next();
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not unauthorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role && req.user.role.toLowerCase() === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

// Allow request to proceed even if not logged in (user will be null)
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await UserService.findById(decoded.id);

      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          subscription: user.subscription,
          work_type: user.work_type,
          nickname: user.nickname,
          notifications: user.notifications,
          preferences: user.preferences,
        };
      }
    } catch (error) {
      console.error("Optional Auth Error:", error.message);
      // Don't return error, just continue as guest
    }
  }
  next();
};

module.exports = { protect, authorize, isAdmin, optionalProtect };
