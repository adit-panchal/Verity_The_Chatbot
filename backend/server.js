require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");

const helmet = require("helmet");
const xss = require("xss-clean");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();

// Connect to Database
connectDB();

// Security Headers
// app.use(helmet());

// Prevent XSS attacks
// app.use(xss());

// Prevent NoSQL injections
// app.use(mongoSanitize());

// Prevent http param pollution
// app.use(hpp());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000, // Increased limit for dev
});
// app.use("/api", limiter); // Temporarily disabled to resolve 429 block

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

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chats", require("./routes/chatRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/privacy", require("./routes/privacyRoutes"));
app.use("/api/2fa", require("./routes/twoFactorRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/image", require("./routes/imageRoutes"));

// Root route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

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
