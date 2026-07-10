const express = require("express");
const axios = require("axios");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

/**
 * GET /api/image/generate?prompt=...
 *
 * Image generation using Pollinations.ai
 */
router.get("/generate", protect, async (req, res) => {
  const { prompt, width = 1024, height = 1024, seed } = req.query;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const decodedPrompt = decodeURIComponent(prompt);
  const currentSeed = seed || Math.floor(Math.random() * 1000000);

  // Directly compile the Pollinations URL
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(decodedPrompt)}?width=${width}&height=${height}&seed=${currentSeed}&nologo=true`;

  console.log(
    `[Pollinations] Redirecting to native browser renderer. Prompt: "${decodedPrompt.substring(0, 50)}..."`,
  );

  // By sending a 302 redirect, the user's browser fetches the image directly.
  // This completely bypasses Cloudflare bot protection since it uses the browser's own valid TLS fingerprint!
  res.setHeader("Cache-Control", "public, max-age=86400");
  return res.redirect(302, imageUrl);
});

module.exports = router;
