const mongoose = require("mongoose");

const attachmentSchema = mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const messageSchema = mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    searchResults: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    usedSearch: {
      type: Boolean,
      default: false,
    },
    attachments: [attachmentSchema],
    extractedText: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const chatSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    messages: [messageSchema],
    title: {
      type: String,
      default: "New Chat",
    },
    settings: {
      model: {
        type: String,
        default: "llama-3.3-70b-versatile",
      },
      useSearch: {
        type: Boolean,
        default: false,
      },
      temperature: {
        type: Number,
        min: 0,
        max: 2,
        default: 0.6,
      },
      systemPrompt: {
        type: String,
        default: null,
      },
      encrypted: {
        type: Boolean,
        default: false,
      },
    },
    summary: {
      type: String,
      default: null,
    },
    tags: [String],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Optimize queries for finding user chats sorted by date
chatSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model("Chat", chatSchema);
