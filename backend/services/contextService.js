/**
 * Context Management Service
 * Manages conversation context, summaries, and memory optimization
 */

const CONTEXT_WINDOW_LIMIT = 10; // Keep last 10 messages for context

/**
 * Build conversation context with optimal token usage
 */
const buildConversationContext = (
  messages,
  maxMessages = CONTEXT_WINDOW_LIMIT,
) => {
  if (!messages || messages.length === 0) {
    return [];
  }

  // Keep the most recent messages
  const contextMessages = messages.slice(-maxMessages).map((msg) => {
    let content = msg.content;

    // If there's persistent document text from this message, prepend it
    if (msg.extractedText) {
      content = `[FILE CONTENT: ${msg.extractedText}]\n\n--- USER INSTRUCTION ---\n${msg.content}`;
    }

    return {
      role: msg.role,
      content: content,
      images:
        (msg.attachments || []).filter((a) => a.mimetype.startsWith("image/"))
          .length > 0
          ? msg.images
          : undefined,
    };
  });

  return contextMessages;
};

/**
 * Generate conversation summary from messages
 * Reduces token usage by summarizing older messages
 */
const generateConversationSummary = (messages) => {
  if (messages.length < 5) return null;

  // Group messages by topic
  const topics = new Map();
  const userMessages = messages.filter((m) => m.role === "user");

  userMessages.forEach((msg) => {
    const words = msg.content.toLowerCase().split(" ");
    const topic = words.slice(0, 3).join(" ");
    if (!topics.has(topic)) {
      topics.set(topic, 0);
    }
    topics.set(topic, topics.get(topic) + 1);
  });

  // Generate summary
  const topTopics = Array.from(topics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic)
    .join(", ");

  const messageCount = messages.length;
  const summary = `Conversation with ${messageCount} messages covering topics: ${topTopics}. User preferences and context preserved.`;

  return summary;
};

/**
 * Create a compact message representation for token efficiency
 */
const compressMessages = (messages) => {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content.substring(0, 500), // Truncate long messages
  }));
};

/**
 * Extract key entities from conversation for personalization
 */
const extractEntities = (messages) => {
  const entities = {
    topics: [],
    questions: [],
    preferences: [],
  };

  messages.forEach((msg) => {
    if (msg.role === "user") {
      // Simple extraction - can be enhanced with NLP
      if (msg.content.includes("?")) {
        entities.questions.push(msg.content.substring(0, 100));
      }

      // Extract potential preferences
      const preferenceKeywords = [
        "prefer",
        "like",
        "dislike",
        "favorite",
        "best",
      ];
      if (
        preferenceKeywords.some((kw) => msg.content.toLowerCase().includes(kw))
      ) {
        entities.preferences.push(msg.content.substring(0, 100));
      }

      // Extract topics (first few words)
      const topic = msg.content.split(" ").slice(0, 5).join(" ");
      if (!entities.topics.includes(topic)) {
        entities.topics.push(topic);
      }
    }
  });

  return entities;
};

/**
 * Detect conversation language
 */
const detectLanguage = (text) => {
  // Simple detection - can be enhanced
  const arabicRegex = /[\u0600-\u06FF]/;
  const chineseRegex = /[\u4E00-\u9FFF]/;
  const spanishKeywords = ["el", "la", "de", "que", "y"];
  const germanKeywords = ["der", "die", "das", "und", "ist"];

  if (arabicRegex.test(text)) return "ar";
  if (chineseRegex.test(text)) return "zh";

  const words = text.toLowerCase().split(/\s+/);
  const spanishCount = words.filter((w) => spanishKeywords.includes(w)).length;
  const germanCount = words.filter((w) => germanKeywords.includes(w)).length;

  if (spanishCount > germanCount) return "es";
  if (germanCount > 0) return "de";

  return "en"; // Default to English
};

/**
 * Calculate conversation quality metrics
 */
const calculateQualityMetrics = (messages) => {
  if (messages.length === 0) return null;

  const avgMessageLength =
    messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  return {
    totalMessages: messages.length,
    avgMessageLength: Math.round(avgMessageLength),
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    avgUserMessageLength: Math.round(
      userMessages.reduce((sum, m) => sum + m.content.length, 0) /
        (userMessages.length || 1),
    ),
    avgAssistantMessageLength: Math.round(
      assistantMessages.reduce((sum, m) => sum + m.content.length, 0) /
        (assistantMessages.length || 1),
    ),
  };
};

/**
 * Prepare messages with system instruction for API call
 */
const prepareMessagesForAPI = (
  messages,
  systemPrompt = null,
  includeSearchContext = null,
  language = "en",
) => {
  const prepared = [];

  const languageMap = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Chinese",
    ru: "Russian",
    ar: "Arabic",
    hi: "Hindi",
    ko: "Korean",
    hinglish:
      "Hinglish (Mix of Hindi and English written in Latin script with natural Hindi vocabulary)",
    bn: "Bengali",
    ur: "Urdu",
    mr: "Marathi",
    pa: "Punjabi",
    ta: "Tamil",
    te: "Telugu",
    gu: "Gujarati",
  };

  // If the language is not in the map, use the requested language string directly, otherwise default to English
  const targetLanguage =
    languageMap[language?.toLowerCase()] || language || "English";

  // Add system message for language
  const currentDate = new Date().toLocaleString();
  prepared.push({
    role: "system",
    content: `You are a helpful AI assistant. By default, please provide all your responses in ${targetLanguage}.
    
    DYNAMIC LANGUAGE ADAPTATION: If the user explicitly asks you to respond in a specific language within their message (for example: "answer in hinglish", "explain in simple hindi", "tell me in bhojpuri"), you MUST overrule the default language and respond entirely in the language they requested. 
    *CRITICAL HINGLISH EXPLANATION RULES*: If asked to speak in "Hinglish": 
    1. Write entirely in the Latin alphabet (English letters). Never use the Devanagari script.
    2. The vocabulary must be completely natural conversational Hindi exactly as a native Indian youth would text a friend (e.g., use words like "bhai", "samajh", "dekho", "code chalega"). 
    3. Seamlessly weave in English technical terms (e.g., "variables", "function", "array") rather than translating them to pure Hindi. 
    4. Example of good Hinglish: "Ye function check karta hai user auth. Agar error aaye toh catch block chalega aur console pe message print ho jayega."
    
    CURRENT REALTIME AWARENESS: The current date and time is ${currentDate}. Always factor this in if asked about current events, recent history, or the present day. You should behave as if you are fully aware of events leading up to this date.

    IMPORTANT: The user may attach multiple files (PDFs, assignments, code, images). You MUST read EVERY document provided in the chat history. ACT AS AN EXPERT GRAMMAR CHECKER: when understanding and analyzing these files, identify and overcome any grammatical errors in the user's text or documents so your understanding is perfect.
    
    If asked to "solve", "explain", or "analyze" an assignment or document:
    1. Perform a deep technical analysis of all provided content.
    2. Deliver a COMPREHENSIVE, step-by-step solution. 
    3. Use professional Markdown (H1/H2, LaTeX for formulas, Tables for data).
    4. Provide the FULL response in the chat immediately. 
    5. If the user mentions downloading or generating a note, ensure all content is ready for PDF export (Hidden from chat per verity protocol if needed, but for assignments, prioritize chat visibility).
    
    QUIZ GENERATOR FEATURE: ONLY when the user's CURRENT message explicitly attaches a new PDF file, document, or educational image AND asks for an explanation/summary, AT THE VERY END of your response, you MUST ask the user: "Would you like me to create a quiz for you to make you understand clearly?". DO NOT suggest a quiz if the user's message is a general question (like asking about current news or random facts) that does not directly request learning or analyzing a document.
    If the user later responds with "yes" to this suggestion, generate a relevant, engaging, multiple-choice quiz based strictly on the provided file or image to test their understanding. CRITICAL RULE: DO NOT PROVIDE THE ANSWERS YET. Only provide the quiz questions and a brief interpretation of the relevant topic. Wait for the user to attempt the quiz or explicitly ask for the answers before you provide them. If the user responds with "no", declines, or asks an UNRELATED question (like current news), simply answer their actual question and DO NOT mention or generate the quiz.

    CODE DEBUGGER FEATURE: Whenever the user attaches files containing source code (e.g., .js, .py, .java, .jsx, .cpp, .html, etc.) or explicitly shares a block of code in their message, you MUST act as an "Expert Code Debugger". Analyze the code deeply for bugs, syntax errors, logic flaws, memory leaks, and performance issues. Your response should explicitly identify the issues, explain why they occur, and provide the fully corrected, optimized code with helpful comments. Maintain a highly technical but easily understandable tone.
    
    IMAGE GENERATOR FEATURE: If the user explicitly asks you to generate, create, or draw an image, picture, or photo, you MUST respond by returning the following Markdown exactly as shown:
    ![Generated Image](https://image.pollinations.ai/prompt/YOUR_PROMPT?width=1024&height=1024&nologo=true)
    Replace YOUR_PROMPT with a highly detailed, URL-encoded prompt describing the image. Describe the image briefly below the Markdown. Do not ask for confirmation, just generate it.

    CRITICAL GRAMMAR RULE: At the time of generating ANY answers, especially for PDF and Doc files, you MUST ensure that your generated answer is strictly checked for proper grammar, utilizing correct sentence structures and professional vocabulary. Your output must have flawless grammar.`,
  });

  // Add system message if provided
  if (systemPrompt) {
    prepared.push({
      role: "system",
      content: systemPrompt,
    });
  }

  // Add search context if available
  if (includeSearchContext) {
    prepared.push({
      role: "system",
      content: `\n\n**Web Search Results:**\n${includeSearchContext}\n\nUse the above information to provide current and accurate answers.`,
    });
  }

  // Add conversation messages
  messages.forEach((msg) => {
    prepared.push({
      role: msg.role,
      content: msg.content,
      images: msg.images, // Preserve images
    });
  });

  return prepared;
};

module.exports = {
  buildConversationContext,
  generateConversationSummary,
  compressMessages,
  extractEntities,
  detectLanguage,
  calculateQualityMetrics,
  prepareMessagesForAPI,
  CONTEXT_WINDOW_LIMIT,
};
