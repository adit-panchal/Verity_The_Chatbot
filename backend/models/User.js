const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    workType: {
      type: String,
      default: "Engineering",
    },
    nickname: {
      type: String,
      default: "",
    },
    preferences: {
      type: String,
      default: "",
    },

    notifications: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    privacySettings: {
      dataRetentionDays: {
        type: Number,
        default: 365, // Default 1 year
      },
      collectAnalytics: {
        type: Boolean,
        default: true,
      },
      encryptionEnabled: {
        type: Boolean,
        default: true,
      },
    },
    settings: {
      theme: {
        type: String,
        default: "dark",
      },
      language: {
        type: String,
        default: "en",
      },
      defaultModel: {
        type: String,
        default: "Groq-pro",
      },
      useSearch: {
        type: Boolean,
        default: false,
      },
      temperature: {
        type: Number,
        default: 0.6,
      },
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorMethod: {
      type: String,
      enum: ["none", "email", "totp"],
      default: "none",
    },
    twoFactorSecret: {
      type: String,
      select: false, // Don't return by default
    },
    subscription: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
  },

  {
    timestamps: true,
  },
);

// Encrypt password using bcrypt
userSchema.pre("save", async function () {
  // If password is not modified, just proceed
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// Match user entered password to hashed password in database.
// Also supports legacy plain-text passwords that may have been stored before bcrypt was enforced.
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;

  if (
    this.password.startsWith("$2") ||
    this.password.startsWith("$2a") ||
    this.password.startsWith("$2b")
  ) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  const isMatch = this.password === enteredPassword;
  if (isMatch) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(enteredPassword, salt);
    if (typeof this.save === "function") {
      await this.save();
    }
  }
  return isMatch;
};

module.exports = mongoose.model("User", userSchema);
