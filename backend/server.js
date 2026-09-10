const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Connect to Database
connectDB();

// Supabase handles security, removed old MongoDB sanitization middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, serverless) or any origin
      callback(null, true);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Serve uploaded files (and /api/uploads for Vercel rewrites)
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", express.static(uploadsDir));

app.use((req, res, next) => {
  console.log(`>>> [DEBUG] ${req.method} ${req.originalUrl}`);
  next();
});

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use((req, res, next) => {
  console.log(`>>> [SERVER] ${req.method} ${req.url}`);
  next();
});

// Rate Limiting (Disabled for development stability)
// const limiter = rateLimit({ ... });
// app.use('/api/', limiter);

// Routes — mount under /api (local + Vite proxy) and at root so Vercel
// catch-all functions that strip the /api prefix still match.
const mountApiRoutes = (prefix) => {
  app.use(`${prefix}/auth`, require("./routes/authRoutes"));
  app.use(`${prefix}/chats`, require("./routes/chatRoutes"));
  app.use(`${prefix}/settings`, require("./routes/settingsRoutes"));
  app.use(`${prefix}/privacy`, require("./routes/privacyRoutes"));
  app.use(`${prefix}/2fa`, require("./routes/twoFactorRoutes"));
  app.use(`${prefix}/admin`, require("./routes/adminRoutes"));
  app.use(`${prefix}/image`, require("./routes/imageRoutes"));
};
mountApiRoutes("/api");
mountApiRoutes("");

// Root route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1)); // Don't crash in dev mode
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(`Uncaught Exception: ${err.message}`);
  // process.exit(1); // Don't crash in dev mode
});

module.exports = app;
