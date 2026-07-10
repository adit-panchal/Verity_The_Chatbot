const Chat = require("../models/Chat");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse"); // Import pdf-parse
const mammoth = require("mammoth"); // Import mammoth for .docx
const {
  getChatCompletionStream,
  generateChatTitle,
} = require("../services/aiService");
const { webSearch, formatSearchResults } = require("../services/searchService");
const {
  buildConversationContext,
  prepareMessagesForAPI,
} = require("../services/contextService");

// @desc    Get all user chats
const getChats = async (req, res) => {
  try {
    // If guest, return empty history (or handle via local storage IDs on frontend)
    if (!req.user) {
      return res.status(200).json([]);
    }

    const userId = req.user._id || req.user.id;
    const chats = await Chat.find({ user: userId })
      .select("_id title updatedAt createdAt")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    res.status(200).json(chats);
  } catch (err) {
    console.error("[ChatController] Error fetching chats:", err);
    console.error(err.stack); // Log full stack trace
    res
      .status(500)
      .json({ message: "Error fetching chats", error: err.message });
  }
};

// @desc    Create/Send message with Streaming (SSE) and Web Search
const sendMessage = async (req, res) => {
  try {
    console.log("[ChatController] ===== NEW REQUEST =====");
    console.log("[ChatController] Request body:", req.body);
    console.log("[ChatController] Request files:", req.files);
    console.log(
      "[ChatController] User:",
      req.user ? "Authenticated" : "Not authenticated",
    );

    const { chatId, message, useSearch, language, model } = req.body;
    const userId = req.user ? req.user._id || req.user.id : null;

    console.log("[ChatController] Received request:", {
      message: message ? `${message.substring(0, 50)}...` : "No message",
      files: req.files ? req.files.length : 0,
      chatId,
      language: language || "en",
      model: model || "default",
      userId: userId ? "Present" : "Guest",
    });

    if (!message && (!req.files || req.files.length === 0)) {
      return res
        .status(400)
        .json({ message: "Please add a message or attach files" });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);

      // Check ownership:
      // 1. If chat belongs to a user, requester must be that user
      // 2. If chat has no user (guest), anyone can reply (simplified guest mode)
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      if (
        chat.user &&
        (!userId || chat.user.toString() !== userId.toString())
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to access this chat" });
      }
    } else {
      // Generate a professional title for new chats
      const aiTitle = await generateChatTitle(message || "New Inquiry");
      chat = new Chat({
        user: userId, // Can be null for guests
        messages: [],
        title: aiTitle,
        settings: {
          model: "llama-3.3-70b-versatile",
          useSearch: useSearch || false,
          temperature: 0.6,
          encrypted: false,
        },
      });
    }

    // Process attachments
    const attachments = [];
    let fileContext = "";

    if (req.files && req.files.length > 0) {
      console.log(
        `[ChatController] Processing ${req.files.length} attachments`,
      );

      // Sort files to prioritize documents (assignments/notes) first in context
      const sortedFiles = [...req.files].sort((a, b) => {
        const docExts = [".pdf", ".docx", ".doc", ".txt"];
        const aIsDoc = docExts.some((ext) =>
          a.originalname.toLowerCase().endsWith(ext),
        );
        const bIsDoc = docExts.some((ext) =>
          b.originalname.toLowerCase().endsWith(ext),
        );
        if (aIsDoc && !bIsDoc) return -1;
        if (!aIsDoc && bIsDoc) return 1;
        return 0;
      });

      for (const file of sortedFiles) {
        console.log(
          `[ChatController] Attachment: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`,
        );
        attachments.push({
          originalName: file.originalname,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
        });

        const filePath = path.join(__dirname, "../uploads", file.filename);
        let extractedText = "";

        try {
          const lowerName = file.originalname.toLowerCase();
          const mime = file.mimetype;

          console.log(
            `[ChatController] Checking file handler for: ${lowerName} (Mime: ${mime})`,
          );

          // 🟢 1. PDF HANDLING
          if (mime === "application/pdf" || lowerName.endsWith(".pdf")) {
            console.log(
              `[ChatController] MATCHED PDF HANDLER: ${file.originalname}`,
            );
            try {
              const dataBuffer = fs.readFileSync(filePath);
              const data = await pdfParse(dataBuffer);
              extractedText = data.text;
              console.log(
                `[ChatController] PDF Extracted Characters: ${extractedText?.length || 0}`,
              );
              if (!extractedText || extractedText.trim().length === 0) {
                console.warn(
                  "[ChatController] WARNING: PDF extracted text is empty (Scanned PDF?)",
                );
                extractedText =
                  "[WARNING: This PDF file appears to be empty or contains only images (scanned). I cannot read the text content directly.]";
              }
            } catch (pdfErr) {
              console.error("[ChatController] PDF Parse Error:", pdfErr);
              extractedText = `[Error reading PDF: ${pdfErr.message}]`;
            }
          }
          // 🟢 2. DOCX HANDLING (Word)
          else if (
            mime ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            lowerName.endsWith(".docx") ||
            lowerName.endsWith(".doc") // Adding .doc support (best effort)
          ) {
            console.log(
              `[ChatController] MATCHED DOCX HANDLER: ${file.originalname}`,
            );
            try {
              const result = await mammoth.extractRawText({ path: filePath });
              extractedText = result.value;
              console.log(
                `[ChatController] Document Extracted Characters: ${extractedText?.length || 0}`,
              );
            } catch (docxErr) {
              console.error("[ChatController] Document Parse Error:", docxErr);
              extractedText = `[Error reading Document: ${docxErr.message}. If this is an old .doc file, try converting it to .docx]`;
            }
          }
          // 🟢 3. TEXT FILES HANDLING (Existing Logic)
          else {
            const isText =
              mime.startsWith("text/") ||
              mime === "application/json" ||
              mime === "application/javascript" ||
              mime === "application/x-javascript" ||
              mime === "application/xml" ||
              mime === "application/json" ||
              mime === "application/yaml" ||
              mime === "application/ld+json" ||
              lowerName.match(
                /\.(txt|md|markdown|json|js|jsx|ts|tsx|css|html|xml|yaml|yml|sql|log|ini|csv|py|java|c|cpp|h|rb|php|go|rs|swift|kt|sh|bat)$/i,
              );

            if (isText) {
              console.log(
                `[ChatController] MATCHED TEXT HANDLER: ${file.originalname}`,
              );
              extractedText = fs.readFileSync(filePath, "utf8");
              console.log(
                `[ChatController] Text File Extracted Characters: ${extractedText?.length || 0}`,
              );
            } else {
              console.log(
                `[ChatController] NO HANDLER MATCHED for: ${file.originalname}`,
              );
            }
          }

          // Append to fileContext if text was extracted
          if (extractedText) {
            // Limit per file (e.g. 20KB) to prevent context flooding
            const MAX_TEXT_SIZE = 25000; // Increased limit for assignments
            if (extractedText.length > MAX_TEXT_SIZE) {
              fileContext += `\n\n--- Start of Document: ${file.originalname} (Truncated for efficiency) ---\n${extractedText.substring(0, MAX_TEXT_SIZE)}...\n--- End of Document Truncation ---\n`;
            } else {
              fileContext += `\n\n--- Start of Document: ${file.originalname} ---\n${extractedText}\n--- End of Document ---\n`;
            }
          }
        } catch (readErr) {
          console.error(
            `[ChatController] Failed to process file ${file.originalname}:`,
            readErr,
          );
        }
      }
    }

    // 🟢 PREPARE SSE HEADERS (Send IMMEDIATELY to reduce perceived latency)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Force headers to be sent

    // Send Initial Metadata (Chat ID) - chat._id is available even before .save()
    res.write(
      `data: ${JSON.stringify({ chatId: chat._id, type: "start" })}\n\n`,
    );

    // Prepare message content
    const displayMessage = message || "[Files attached]";
    const aiContextMessage = (message || "") + fileContext;
    const finalAiMessage =
      aiContextMessage.trim() || "[Files attached without message]";

    // Save user message with attachments (BUT NOT the file content text)
    // Running this after headers are sent so the connection is already "live" for the user
    chat.messages.push({
      role: "user",
      content: displayMessage, // Save clean message to DB
      attachments: attachments,
      extractedText: fileContext || null,
    });
    await chat.save();

    // 🎨 NEW: Check if this is a direct image generation command
    const trimmedVal = message ? message.trim() : "";
    if (trimmedVal.startsWith("/image ")) {
      const imagePrompt =
        trimmedVal.substring(7).trim() || "A beautiful landscape";
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=1024&seed=${Date.now()}&nologo=true`;
      const aiResponse = `![Generated Image for: ${imagePrompt}](${imageUrl})\n\n*Here is the image you requested based on the prompt: "${imagePrompt}"*`;

      if (res.writable) {
        res.write(
          `data: ${JSON.stringify({ chunk: aiResponse, type: "chunk" })}\n\n`,
        );
      }

      chat.messages.push({
        role: "assistant",
        content: aiResponse,
      });
      await chat.save();

      if (res.writable) {
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
      }
      return;
    }

    let fullAiContent = "";
    let searchResults = null;

    // 🔍 PERFORM WEB SEARCH IF ENABLED
    if (useSearch) {
      try {
        res.write(`data: ${JSON.stringify({ type: "search_start" })}\n\n`);
        console.log("[ChatController] Starting web search...");
        searchResults = await webSearch(message || "search", { count: 5 });
        res.write(
          `data: ${JSON.stringify({ type: "search_complete", results: searchResults })}\n\n`,
        );
      } catch (searchError) {
        console.error("[ChatController] Search error:", searchError.message);
        res.write(
          `data: ${JSON.stringify({ type: "search_error", message: searchError.message })}\n\n`,
        );
      }
    }

    // Build context with conversation history
    const contextMessages = buildConversationContext(
      chat.messages.slice(0, -1), // Exclude the message we just added
      10, // Keep last 10 messages for context
    );

    // Format search results for AI context
    const searchContext = searchResults
      ? formatSearchResults(searchResults)
      : null;

    // Prepare user message for AI (Includes file content)
    let finalUserContent = message || "[Files attached]";
    if (fileContext.length > 0) {
      finalUserContent = `[ATTACHED DOCUMENTS CONTENT]:\n${fileContext}\n\n[USER INSTRUCTION]: ${message || "Please analyze the attached document(s) and solve any questions or assignments within."}`;
    }

    let userMessageForAI = { role: "user", content: finalUserContent };

    // Add image URLs to message if there are image attachments
    if (attachments && attachments.length > 0) {
      const imageAttachments = attachments.filter((att) =>
        att.mimetype.startsWith("image/"),
      );

      if (imageAttachments.length > 0) {
        console.log(
          "[ChatController] Adding images to AI message:",
          imageAttachments.length,
        );
        // Include image paths for the AI service to process
        userMessageForAI.images = imageAttachments
          .map((att) => {
            try {
              const filePath = path.join(
                __dirname,
                "..",
                "uploads",
                att.filename,
              );
              const fileBuffer = fs.readFileSync(filePath);
              const base64Image = fileBuffer.toString("base64");
              return {
                filename: att.filename,
                originalName: att.originalName,
                base64: `data:${att.mimetype};base64,${base64Image}`,
              };
            } catch (err) {
              console.error(
                `[ChatController] Error reading image file ${att.filename}:`,
                err,
              );
              return null;
            }
          })
          .filter(Boolean); // Remove any failed reads
      }
    }

    // Prepare messages with system instruction
    const aiMessages = prepareMessagesForAPI(
      contextMessages.concat([userMessageForAI]),
      chat.settings?.systemPrompt || null,
      searchContext,
      language || "en",
    );

    let isAborted = false;
    req.on("close", () => {
      isAborted = true;
    });

    await getChatCompletionStream(
      aiMessages,
      model || "gpt-3.5-turbo",
      (chunk) => {
        if (isAborted) return;
        fullAiContent += chunk;
        if (res.writable) {
          res.write(`data: ${JSON.stringify({ chunk, type: "chunk" })}\n\n`);
        }
      },
      async (fullText) => {
        if (isAborted) return;
        try {
          // Save AI response to DB with search metadata
          chat.messages.push({
            role: "assistant",
            content: fullText,
            searchResults: searchResults,
            usedSearch: !!useSearch,
          });
          await chat.save();
          if (res.writable) {
            res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            res.end();
          }
        } catch (saveError) {
          console.error("Error saving chat history:", saveError);
          if (res.writable && !res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({ error: "Failed to save chat", type: "error" })}\n\n`,
            );
            res.end();
          }
        }
      },
      (error) => {
        console.error("Stream Error:", error);
        if (res.writable && !res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({ error: error.message, type: "error" })}\n\n`,
          );
          res.end();
        }
      },
    );
  } catch (error) {
    console.error("Critical Error in sendMessage:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const getChatById = async (req, res) => {
  try {
    const userId = req.user ? req.user._id || req.user.id : null;

    // Optimize: Exclude heavy fields like extractedText which are internal context only
    // This dramatically speeds up loading chats with large documents attached
    const chat = await Chat.findById(req.params.id)
      .select("-messages.extractedText")
      .lean();

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Access control:
    // 1. If chat belongs to a user, strictly require that user
    // 2. If chat has no user (guest), allow access
    if (chat.user && (!userId || chat.user.toString() !== userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("[ChatController] Error fetching chat:", err);
    res.status(500).json({ message: "Error fetching chat" });
  }
};

const deleteChat = async (req, res) => {
  try {
    const userId = req.user ? req.user._id || req.user.id : null;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.user && (!userId || chat.user.toString() !== userId.toString())) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this chat" });
    }

    await chat.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (err) {
    console.error("[ChatController] Error deleting chat:", err);
    res.status(500).json({ message: "Error deleting chat" });
  }
};

const renameChat = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const userId = req.user ? req.user._id || req.user.id : null;
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.user && (!userId || chat.user.toString() !== userId.toString())) {
      return res
        .status(403)
        .json({ message: "Not authorized to rename this chat" });
    }

    chat.title = title;
    await chat.save();
    res.status(200).json(chat);
  } catch (err) {
    console.error("[ChatController] Error renaming chat:", err);
    res.status(500).json({ message: "Error renaming chat" });
  }
};

const clearChats = async (req, res) => {
  try {
    if (!req.user) {
      // Guests don't have a history to clear in DB (it's all client side)
      // Or if we implemented guest sessions, we would clear them here.
      // For now, just return success.
      return res.status(200).json({ message: "Guest history cleared" });
    }
    const userId = req.user._id || req.user.id;
    await Chat.deleteMany({ user: userId });
    res.status(200).json({ message: "All chats cleared" });
  } catch (err) {
    console.error("[ChatController] Error clearing chats:", err);
    res.status(500).json({ message: "Error clearing chats" });
  }
};

module.exports = {
  getChats,
  sendMessage,
  getChatById,
  deleteChat,
  clearChats,
  renameChat,
};
