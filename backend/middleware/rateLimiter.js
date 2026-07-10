const rateLimit = require("express-rate-limit");

/**
 * AI Chat Rate Limiter
 * Dynamically assigns limits based on user role and subscription status.
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1-hour time window

  // Dynamically determine the maximum number of requests allowed
  max: (req, res) => {
    // 1. Admins get virtually unlimited messages
    if (req.user && req.user.role === "admin") return 1000;

    // 2. Pro subscribers get a high limit
    if (req.user && req.user.subscription === "pro") return 150;

    // 3. Free users and Guests get a strict limit
    return 15;
  },

  // Track requests by User ID if logged in, otherwise use their IP address
  keyGenerator: (req) => {
    return req.user
      ? req.user._id.toString()
      : rateLimit.ipKeyGenerator(req.ip);
  },

  // The JSON response sent back when they hit the limit
  handler: (req, res) => {
    res.status(429).json({
      error:
        "Hourly message limit reached. Please upgrade to Pro for more messages, or wait an hour to continue chatting.",
      type: "rate_limit_exceeded",
    });
  },

  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { chatLimiter };
