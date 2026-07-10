// middleware/errorHandler.js
// Centralized error handling middleware for Express
// Captures errors from async route handlers and returns JSON response

const errorHandler = (err, req, res, next) => {
  console.error("=== ERROR HANDLER TRIGGERED ===");
  console.error("Error Message:", err.message);
  console.error("Error Stack:", err.stack);
  console.error("Request URL:", req.url);
  console.error("Request Method:", req.method);
  console.error("================================");
  
  // If response status is 200, set to 500 (internal server error)
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    // Hide stack trace in production
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { errorHandler };
