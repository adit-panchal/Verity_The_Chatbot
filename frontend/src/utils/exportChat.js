/**
 * Export chat messages to Markdown format
 */
export const exportToMarkdown = (messages, chatTitle = "Chat History") => {
  let markdown = `# ${chatTitle}\n\n`;
  markdown += `*Exported at ${new Date().toLocaleString()}*\n\n---\n\n`;

  messages.forEach((msg) => {
    const role =
      msg.role === "assistant" || msg.role === "bot" ? "Assistant" : "You";
    markdown += `## ${role}\n\n${msg.content}\n\n---\n\n`;
  });

  return markdown;
};

/**
 * Export chat messages to plain text format
 */
export const exportToText = (messages, chatTitle = "Chat History") => {
  let text = `${chatTitle}\n`;
  text += `Exported at ${new Date().toLocaleString()}\n`;
  text += `${"=".repeat(60)}\n\n`;

  messages.forEach((msg, index) => {
    const role =
      msg.role === "assistant" || msg.role === "bot" ? "ASSISTANT" : "YOU";
    text += `[${index + 1}] ${role}:\n`;
    text += `${msg.content}\n\n`;
    text += `${"-".repeat(60)}\n\n`;
  });

  return text;
};

/**
 * Generate an easy-to-remember professional filename
 */
const generateProfessionalFilename = (title, extension) => {
  // Common words to exclude
  const commonWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "is",
    "are",
    "be",
    "was",
    "were",
    "write",
    "describe",
    "explain",
    "about",
  ]);

  // Split title into words and filter out common words
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // Replace special chars with spaces
    .split(/\s+/) // Split by whitespace
    .filter((word) => word.length > 2 && !commonWords.has(word)); // Keep meaningful words

  // Take main keywords (up to 2) and capitalize them
  const keywords = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("_");

  // Use default if no keywords found
  const finalFilename = keywords || "Document";

  return `${finalFilename}.${extension}`;
};

/**
 * Clean content by removing only the brief message and instruction text
 * Keep the actual generated content for PDF export
 */
const cleanContentForPDF = (text) => {
  let lines = text.split("\n");
  let contentStarted = false;
  let hasFoundContent = false;

  // Filter out the brief message section at the top
  lines = lines.filter((line, index) => {
    const trimmed = line.trim();
    const lowerLine = trimmed.toLowerCase();

    // Skip brief message lines at the beginning
    if (!contentStarted) {
      if (
        lowerLine.includes("i've created") ||
        lowerLine.includes("i have created") ||
        lowerLine.includes("download the") ||
        lowerLine.includes("📄") ||
        lowerLine.includes("if you want") ||
        lowerLine.includes("tell me and") ||
        lowerLine.includes("i'll remake") ||
        lowerLine.includes("🛠️") ||
        lowerLine.includes("🎨") ||
        trimmed === ""
      ) {
        return false; // Skip these lines
      } else {
        contentStarted = true; // Once we hit actual content, stop filtering these lines
        hasFoundContent = true;
      }
    }

    // After content started, remove any remaining verdict/instruction lines
    if (
      lowerLine.startsWith("strategic verdict:") ||
      lowerLine.startsWith("verdict:") ||
      (lowerLine.includes("if you want") && lowerLine.includes("longer essay"))
    ) {
      return false;
    }

    return true;
  });

  // Join and clean up multiple consecutive empty lines
  let content = lines
    .join("\n")
    .replace(/\n\n\n+/g, "\n\n")
    .trim();

  return content;
};

/**
 * Parse markdown-style text to extract structure
 */
const parseMarkdownContent = (text) => {
  const lines = text.split("\n");
  const parsed = [];
  let currentBlock = { type: "paragraph", content: [] };

  lines.forEach((line) => {
    line = line.trim();

    if (line.startsWith("# ")) {
      if (currentBlock.content.length > 0) parsed.push(currentBlock);
      parsed.push({ type: "h1", content: line.substring(2).trim() });
      currentBlock = { type: "paragraph", content: [] };
    } else if (line.startsWith("## ")) {
      if (currentBlock.content.length > 0) parsed.push(currentBlock);
      parsed.push({ type: "h2", content: line.substring(3).trim() });
      currentBlock = { type: "paragraph", content: [] };
    } else if (line.startsWith("### ")) {
      if (currentBlock.content.length > 0) parsed.push(currentBlock);
      parsed.push({ type: "h3", content: line.substring(4).trim() });
      currentBlock = { type: "paragraph", content: [] };
    } else if (line.startsWith("- ")) {
      if (currentBlock.type !== "list") {
        if (currentBlock.content.length > 0) parsed.push(currentBlock);
        currentBlock = { type: "list", content: [] };
      }
      currentBlock.content.push(line.substring(2).trim());
    } else if (line === "") {
      if (currentBlock.content.length > 0) {
        parsed.push(currentBlock);
        currentBlock = { type: "paragraph", content: [] };
      }
    } else {
      if (currentBlock.type !== "paragraph") {
        if (currentBlock.content.length > 0) parsed.push(currentBlock);
        currentBlock = { type: "paragraph", content: [] };
      }
      if (line) currentBlock.content.push(line);
    }
  });

  if (currentBlock.content.length > 0) parsed.push(currentBlock);
  return parsed;
};

/**
 * Export chat to PDF format with clear, crisp text
 */
export const exportToPDF = async (messages, chatTitle = "Solution") => {
  const { jsPDF } = await import("jspdf");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20; // Increased margin for better breathing room
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const addPage = (newPageNeeded = true) => {
    if (newPageNeeded) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  const checkPageBreak = (heightNeeded) => {
    if (yPosition + heightNeeded > pageHeight - margin) {
      addPage(true);
    }
  };

  // Enhanced title with better typography
  pdf.setFont("Helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(20, 40, 80);

  const titleLines = pdf.splitTextToSize(chatTitle, contentWidth);
  const titleHeight = titleLines.length * 10;
  pdf.text(titleLines, margin, yPosition);
  yPosition += titleHeight + 3;

  // Elegant separator line
  pdf.setDrawColor(20, 40, 80);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Timestamp with refined styling
  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 15;

  // Process and add messages
  messages.forEach((msg) => {
    if (!msg.content) return;

    // Clean the content before parsing
    const cleanedContent = cleanContentForPDF(msg.content);
    if (!cleanedContent) return;

    const parsed = parseMarkdownContent(cleanedContent);

    parsed.forEach((block) => {
      checkPageBreak(15);

      if (block.type === "h1") {
        // Main heading with enhanced spacing
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(20, 40, 80);
        const lines = pdf.splitTextToSize(block.content, contentWidth);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * 9 + 6;
      } else if (block.type === "h2") {
        // Section heading with better hierarchy
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(30, 70, 120);
        const lines = pdf.splitTextToSize(block.content, contentWidth);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * 7.5 + 5;
      } else if (block.type === "h3") {
        // Subsection heading
        pdf.setFont("Helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(40, 90, 140);
        const lines = pdf.splitTextToSize(block.content, contentWidth);
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * 6.5 + 4;
      } else if (block.type === "list") {
        // Enhanced list formatting with better bullets
        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(30, 30, 30);
        block.content.forEach((item) => {
          checkPageBreak(8);
          const lines = pdf.splitTextToSize(`• ${item}`, contentWidth - 6);
          pdf.text(lines, margin + 3, yPosition);
          yPosition += lines.length * 6 + 2;
        });
        yPosition += 3;
      } else if (block.type === "paragraph") {
        // Body text with optimal line height
        pdf.setFont("Helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(30, 30, 30);
        const fullText = block.content.join(" ");
        const lines = pdf.splitTextToSize(fullText, contentWidth);

        // Improved line spacing for readability
        lines.forEach((line, index) => {
          checkPageBreak(6);
          pdf.text(line, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 5; // Extra spacing after paragraph
      }
    });
  });

  const filename = generateProfessionalFilename(chatTitle || "document", "pdf");
  pdf.save(filename);
};

/**
 * Download text as a file
 */
export const downloadFile = (content, filename, mimeType = "text/plain") => {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`,
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
    document.body.removeChild(element);
  };

  /**
   * Export chat to Markdown file
   */
  export const exportChatAsMarkdown = (messages, chatTitle = "Chat") => {
    const markdown = exportToMarkdown(messages, chatTitle);
    const filename = generateProfessionalFilename(chatTitle, "md");
    downloadFile(markdown, filename, "text/markdown");
  };

  /**
   * Export chat to Text file
   */
  export const exportChatAsText = (messages, chatTitle = "Chat") => {
    const text = exportToText(messages, chatTitle);
    const filename = generateProfessionalFilename(chatTitle, "txt");
    downloadFile(text, filename, "text/plain");
  };

  /**
   * Export chat to PDF file
 */
export const exportChatAsPDF = async (messages, chatTitle = "Chat") => {
  try {
    await exportToPDF(messages, chatTitle);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert("Failed to export PDF. Please try again.");
  }
};
