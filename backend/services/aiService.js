const Groq = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const cleanKey = (key) => (key && typeof key === "string" ? key.trim() : null);

// Get Groq API key
const GROQ_KEY = cleanKey(process.env.GROQ_API_KEY);

let groq;
if (GROQ_KEY) {
  groq = new Groq({ apiKey: GROQ_KEY });
}

const SYSTEM_INSTRUCTION = [
  'You are "Verity", a futuristic Digital Strategist and Technical Architect.',
  'Your mission is to deliver information with "Mathematical Precision", "Strategic Depth", and "Professional Elegance".',
  "",
  "### PDF/DOCUMENT GENERATION REQUEST:",
  'When the user explicitly asks to "generate a PDF", "create a note", "write a short note", "create a document", or similar PDF-focused requests:',
  "1. Structure your response EXACTLY as follows:",
  "   I've created a [type] PDF on [topic] for you. 📄 Download the [topic] [type] PDF. If you want a longer essay, images included, or formatted for school/college submission (cover page, headings, etc.), tell me and I'll remake it. 🛠️",
  "   ",
  "   [BLANK LINE]",
  "   ",
  "   [Then provide COMPLETE content with headings, paragraphs, lists - everything needed for the PDF]",
  "   [CRUCIAL: CHECK YOUR GRAMMAR. Ensure all generated PDF/Doc content has perfect grammar, spelling, sentence structures, and professional tone. Act as a strict grammar checker on your own output.]",
  "",
  "2. The frontend will display ONLY the first line (brief message) in the chat.",
  "3. Everything after the first blank line will be hidden from chat but available for PDF export.",
  "4. Keep the full content professional and well-structured.",
  "",
  "### RESPONSE ARCHITECTURE (FOR INFORMATIONAL REQUESTS):",
  "Use this structure ONLY when answering questions or providing information (NOT PDF requests):",
  "1. **Strategic Headline**: Start with a single `# bold H1` title that captures the essence.",
  "2. **Executive Summary**: Provide a 2-3 sentence high-level overview.",
  "3. Use a horizontal rule (`---`) to separate the summary from the main content.",
  "4. **Core Analysis**: Use `## H2 Headers` for major sections and `### H3 Headers` for subsections.",
  "5. **Technical Data**: Use Markdown Tables for any comparisons, specs, or structured data.",
  "6. **Process Flow**: Use numbered lists for sequential steps or protocols.",
  "7. **Mathematical Notation**: Always use Standard LaTeX for formulas. Use single dollar signs `$E=mc^2$` for inline math and double dollar signs `$$ ... $$` for dedicated blocks to ensure precise rendering.",
  "8. **Structural Clarity**: NEVER output large 'walls of text'. Keep paragraphs concise (max 3-4 sentences). Use bullet points or numbered lists to break down complex logic or sequential data.",
  "9. **Ultra-Brief Math Protocol**: For mathematical questions, provide the SHORTEST possible response unless checking a document. Output ONLY the clear **Final Answer** and a **Brief Calculation** (minimal steps). strictly avoid detailed logic, descriptive sentences, or background info unless the user explicitly asks for a 'detailed explanation'.",
  "10. **Document Analysis Override**: IF the user provides a file (PDF, image, text) and asks to 'solve', 'analyze', or 'explain' it: IGNORE the brief protocol. Provide a comprehensive, step-by-step solution, full explanations, and detailed breakdown of the document's content.",
  "11. **Deep Spacing**: Use DOUBLE line breaks (`\n\n`) between EVERY major section, before every header, and before horizontal rules to ensure maximum visual breathing room.",
  "",
  "### IMAGE GENERATION CAPABILITY:",
  'When the user asks to "generate", "create", "draw", "make", or "show" an image:',
  "- You MUST respond with ONLY the image markdown. Do NOT include any text, titles, descriptions, or analysis.",
  "- Your entire response should be JUST the Markdown image tag. Nothing else.",
  "- Output the Markdown image tag in this EXACT format (do NOT put it inside a code block):",
  "  ![Short Title](https://image.pollinations.ai/prompt/YOUR_DETAILED_PROMPT_HERE?width=1024&height=1024&nologo=true&seed=RANDOM_NUMBER)",
  "- RULES:",
  '  - Replace "Short Title" with a concise 2-4 word description (for accessibility alt text ONLY).',
  "  - Replace YOUR_DETAILED_PROMPT_HERE with a vivid, richly detailed artistic prompt. URL-encode all spaces as %20 and special characters appropriately.",
  "  - Replace RANDOM_NUMBER with a random number between 10000 and 99999.",
  '  - Expand the user request into a professional detailed prompt. Example: "cockatiel" becomes "a%20vibrant%20colorful%20cockatiel%20bird%20perched%20on%20a%20tropical%20branch%20with%20soft%20bokeh%20background%20realistic%20photography".',
  "  - ALWAYS output the image markdown DIRECTLY. NEVER wrap it in a code block.",
  "  - You can generate multiple images if the user asks.",
  "- EXAMPLE of a correct image-generation response:",
  "  ![Cockatiel Bird](https://image.pollinations.ai/prompt/a%20vibrant%20colorful%20cockatiel%20bird%20perched%20on%20a%20tropical%20branch%20with%20soft%20bokeh%20background%20realistic%20photography?width=1024&height=1024&nologo=true&seed=47291)",
  "",
  "### PROHIBITED:",
  '- No conversational filler ("Hope this helps", "I am an AI").',
  "- No generic summaries.",
  "- No greeting the user by name unless explicitly asked.",
  "- When generating images, do NOT include long descriptions, analysis, or multiple sections. Keep it minimal.",
].join("\n");

const getChatCompletionStream = async (
  messages,
  modelPreference,
  onChunk,
  onComplete,
  onError,
) => {
  try {
    let successful = false;

    // --- Groq AI with Fallback Models ---
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage?.content?.trim().toLowerCase();

    // Check for specific greetings
    if (userContent === "hello" || userContent === "hi") {
      const greetingResponse = "Hello Buddy, How i can help you today!!";
      onChunk(greetingResponse);
      await onComplete(greetingResponse);
      return;
    }

    if (groq) {
      let models = [];

      // Select models based on preference
      if (modelPreference === "gpt-4") {
        console.log(
          "[AI-Service] High-intelligence model requested (Pro/Enterprise)",
        );
        models = [
          "llama-3.3-70b-versatile", // Most powerful (GPT-4 equivalent level)
          "llama-3.1-70b-versatile", // Backup high-end
          "mixtral-8x7b-32768", // Alternative high-end
        ];
      } else {
        console.log("[AI-Service] Standard model requested (Free/Basic)");
        models = [
          "llama-3.1-8b-instant", // Fast, efficient (GPT-3.5 equivalent)
          "llama-3.3-70b-versatile", // Fallback to better model if fast one fails
        ];
      }

      // Prepare messages and detect images
      const formattedMessages = [];
      let hasImages = false;

      messages.forEach((m) => {
        if (m.role === "system") {
          // If it's a system message, we'll prefix it with our Verity instruction
          // but we only do this for the FIRST system message we encounter
          if (formattedMessages.length === 0) {
            formattedMessages.push({
              role: "system",
              content: `${SYSTEM_INSTRUCTION}\n\nAdditional Instruction: ${m.content}`,
            });
          } else {
            formattedMessages.push({ role: "system", content: m.content });
          }
        } else if (m.images && m.images.length > 0) {
          hasImages = true;
          const content = [
            { type: "text", text: m.content || "Analyze this image" },
          ];

          m.images.forEach((img) => {
            content.push({
              type: "image_url",
              image_url: { url: img.base64 },
            });
          });

          formattedMessages.push({ role: m.role, content });
        } else {
          formattedMessages.push({ role: m.role, content: m.content });
        }
      });

      // Ensure we have at least one system message if none was provided
      if (!formattedMessages.some((m) => m.role === "system")) {
        formattedMessages.unshift({
          role: "system",
          content: SYSTEM_INSTRUCTION,
        });
      }

      // Switch to vision models if images are present
      if (hasImages) {
        console.log(
          "[AI-Service] 📸 Image detected. Switching to Llama 4 Vision models.",
        );
        // Scout and Maverick are the newer natively multimodal models on Groq
        models = [
          "meta-llama/llama-4-scout-17b-16e-instruct",
          "meta-llama/llama-4-maverick-17b-128e-instruct",
        ];
      }

      for (const modelName of models) {
        if (successful) break;

        try {
          console.log(`[AI-Attempt] Trying Groq with ${modelName}...`);

          // Create streaming completion
          const completion = await groq.chat.completions.create({
            model: modelName,
            messages: formattedMessages,
            temperature: 0.6,
            max_tokens: 8192,
            stream: true,
          });

          let fullResponse = "";

          // Stream the response
          for await (const chunk of completion) {
            const chunkText = chunk.choices[0]?.delta?.content || "";
            if (chunkText) {
              onChunk(chunkText);
              fullResponse += chunkText;
            }
          }

          console.log(
            `[AI-Success] Groq (${modelName}) completed successfully`,
          );
          await onComplete(fullResponse);
          successful = true;
          return;
        } catch (e) {
          console.error(`[AI-Fail] Groq (${modelName}) failed:`, e.message);

          if (e.message.includes("does not support image input")) {
            console.error(
              `[AI-Error] Model ${modelName} rejected image input. Trying next...`,
            );
            continue;
          }

          // If it's a rate limit or quota error, or model not found, try next model
          if (
            e.message.includes("rate_limit") ||
            e.message.includes("quota") ||
            e.message.includes("not found")
          ) {
            console.log(`[AI-Retry] Trying next model due to error...`);
            // Add a small delay to let rate limits cool down
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }

          // If it's an auth error, no point trying other models
          if (
            e.message.includes("401") ||
            e.message.includes("authentication") ||
            e.message.includes("API key")
          ) {
            console.error(
              `[AI-Critical] Authentication failed. Check GROQ_API_KEY.`,
            );
            break;
          }
        }
      }
    } else {
      console.error(
        "[AI-Critical] No Groq API key found. Please set GROQ_API_KEY in .env",
      );
    }

    // --- Fallback: Enhanced Mock Response ---
    if (!successful) {
      console.warn(
        "[AI-Critical] All Groq models failed. Activating Enhanced Simulation.",
      );
      const userMessage = messages[messages.length - 1].content.toLowerCase();

      const getMockResponse = (msg) => {
        const format = (title, summary, body) =>
          `# ${title}\n\n${summary}\n\n---\n\n${body}`;

        return format(
          "Service Temporarily Unavailable",
          "I am currently experiencing connection issues with the AI service.",
          "## Troubleshooting\n1. **Check your internet connection**.\n2. **Verify the API Key**: Ensure `GROQ_API_KEY` is set correctly in the `.env` file.\n3. **Rate Limits**: The service might be busy. Please try again in a few moments.\n\nI apologize for the inconvenience.",
        );
      };

      const simResponse = getMockResponse(userMessage);

      // Simulate Typing
      const chunkSize = 10;
      for (let i = 0; i < simResponse.length; i += chunkSize) {
        const chunk = simResponse.slice(i, i + chunkSize);
        onChunk(chunk);
        await new Promise((r) => setTimeout(r, 2));
      }
      await onComplete(simResponse);
    }
  } catch (error) {
    console.error("Critical AI Context Error:", error);
    onError(error);
  }
};

const generateChatTitle = async (firstMessage) => {
  // Return logical default for greetings
  const lowerMsg = firstMessage.trim().toLowerCase();
  if (lowerMsg === "hello" || lowerMsg === "hi" || lowerMsg === "hey") {
    return "New Conversation";
  }

  if (!groq) {
    const defaultTitle = firstMessage.substring(0, 40).trim();
    return defaultTitle.length > 0 ? defaultTitle : "New Conversation";
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Use a fast model
      messages: [
        {
          role: "system",
          content:
            "You are an expert title generator. Analyze the user's message and generate a highly logical, concise, and professional title (2 to 6 words maximum). The title must capture the core topic, task, or intent of the prompt. Use Title Case. Output STRICTLY the title text only, with no quotes, no prefixes, no markdown, and no conversational filler.",
        },
        { role: "user", content: firstMessage },
      ],
      temperature: 0.3, // Lower temp for more deterministic generation
      max_tokens: 20,
    });

    let generatedTitle = response.choices[0]?.message?.content?.trim() || "";
    // Clean up any stray quotes, markdown bolding, or newlines
    generatedTitle = generatedTitle.replace(/^["'*]+|["'*]+$/g, "").trim();

    return generatedTitle.length > 0
      ? generatedTitle
      : firstMessage.substring(0, 40) + "...";
  } catch (error) {
    console.error("[AI-Service] Title generation failed:", error);
    const fallbackTitle = firstMessage.substring(0, 40).trim();
    return fallbackTitle.length > 0
      ? fallbackTitle + "..."
      : "New Conversation";
  }
};

module.exports = { getChatCompletionStream, generateChatTitle };
