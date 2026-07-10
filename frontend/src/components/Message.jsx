import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  User,
  Bot,
  Copy,
  Check,
  Edit2,
  RotateCcw,
  Download,
  Search,
  Loader2,
  MoreVertical,
  FileText,
  FileCode,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import "../styles/Message.css";

// Message component for displaying chat messages

// Dedicated component for AI-generated images with retry logic
const AiImage = ({ src, alt }) => {
  const [status, setStatus] = useState("loading"); // "loading" | "loaded" | "error"
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      console.log(`[AiImage] Retry ${retryCount + 1}/${MAX_RETRIES}`);
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setStatus("loading");
      }, 2000);
    } else {
      console.error(`[AiImage] Failed after ${MAX_RETRIES} retries`);
      setStatus("error");
    }
  }, [retryCount]);

  const handleLoad = useCallback(() => {
    console.log(`[AiImage] Image loaded successfully`);
    setStatus("loaded");
  }, []);

  // Append retry count to URL to bypass browser cache on retry
  const imgSrc =
    retryCount > 0
      ? `${src}${src.includes("?") ? "&" : "?"}retry=${retryCount}`
      : src;

  return (
    <div className="ai-generated-image-container">
      {status === "loading" && (
        <div className="ai-image-loading">
          <Loader2 size={28} className="spin" />
          <span>Generating image — this may take up to a minute...</span>
        </div>
      )}
      <img
        key={retryCount}
        src={imgSrc}
        alt={alt || "AI Generated Image"}
        className={`ai-generated-image ${status === "loaded" ? "visible" : "hidden"}`}
        loading="lazy"
        onClick={() => window.open(src, "_blank")}
        onLoad={handleLoad}
        onError={handleError}
      />
      {status === "error" && (
        <div className="ai-image-error">
          <span>⚠️ Image generation service is experiencing issues. </span>
          <button
            className="retry-image-btn"
            onClick={() => {
              setRetryCount(0);
              setStatus("loading");
            }}
          >
            Try Again
          </button>
        </div>
      )}
      {alt && status === "loaded" && <p className="ai-image-caption">{alt}</p>}
    </div>
  );
};

const CodeBlock = ({ inline, className, children }) => {
  const { t } = useLanguage();
  const [copiedCode, setCopiedCode] = useState(false);
  const language = className?.replace(/language-/, "") || "text";
  const code = String(children).replace(/\n$/, "");

  if (inline) {
    return <code className="inline-code">{children}</code>;
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-language">{language}</span>
        <button
          className={`code-copy-btn ${copiedCode ? "copied" : ""}`}
          onClick={handleCopyCode}
          title={t("copy")}
        >
          {copiedCode ? <Check size={16} /> : <Copy size={16} />}
          <span>{copiedCode ? t("copied") : t("copy")}</span>
        </button>
      </div>
      <pre className="code-block">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

const Message = ({
  role,
  content,
  streaming,
  status, // "searching", "generating"
  onEdit,
  onRegenerate,
  messageIndex,
  totalMessages,
  onExportMarkdown,
  onExportText,
  onExportPDF,
  attachments = [],
}) => {
  const { t } = useLanguage();
  const isAssistant = role === "assistant" || role === "bot";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  let displayContent = "";
  if (typeof content === "string") {
    displayContent = content;
  } else if (content && typeof content === "object") {
    displayContent = content.text || content.content || JSON.stringify(content);
  }

  // For PDF responses, show only the brief message in chat
  let chatDisplayContent = displayContent;
  if (isAssistant && displayContent.includes("I've created a")) {
    // Extract only the brief message (everything before the first blank line)
    const parts = displayContent.split("\n\n");
    if (parts.length > 1) {
      chatDisplayContent = parts[0]; // Show only the brief message
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditClick = () => {
    setEditedContent(displayContent);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      onEdit?.(messageIndex, editedContent);
      setIsEditing(false);
      setEditedContent("");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent("");
  };

  const handleRegenerateClick = () => {
    onRegenerate?.(messageIndex);
  };

  return (
    <div
      className={`message-container ${
        isAssistant ? "assistant" : "user"
      } slide-up`}
    >
      <div className="message-wrapper">
        <div
          className={`avatar ${isAssistant ? "bot-avatar" : "user-avatar"} ${
            isAssistant && (streaming || status) ? "thinking" : ""
          }`}
        >
          {isAssistant ? <Bot size={22} /> : <User size={22} />}
        </div>

        <div className="message-content-wrapper">
          {isEditing && !isAssistant ? (
            <div className="edit-mode">
              <textarea
                className="edit-textarea"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                autoFocus
              />
              <div className="edit-actions">
                <button
                  className="edit-save-btn"
                  onClick={handleSaveEdit}
                  disabled={!editedContent.trim()}
                >
                  {t("saveChange")}
                </button>
                <button className="edit-cancel-btn" onClick={handleCancelEdit}>
                  {t("cancelChange")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="message-content">
                {isAssistant ? (
                  <div className="markdown-content">
                    {status && (
                      <div className={`message-status-container ${status}`}>
                        {status === "searching" ? (
                          <div className="status-badge search-badge">
                            <Search size={14} className="status-icon" />
                            <span>Searching the web...</span>
                          </div>
                        ) : (
                          <div className="status-badge generate-badge">
                            <Loader2 size={14} className="status-icon spin" />
                            <span>Generating response...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {chatDisplayContent ? (
                      <div
                        className={`markdown-wrapper ${streaming ? "is-streaming" : ""}`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            pre: ({ children }) => <>{children}</>,
                            code: CodeBlock,
                            p: ({ children }) => (
                              <div className="markdown-paragraph">
                                {children}
                              </div>
                            ),
                            img: ({ src, alt }) => (
                              <AiImage src={src} alt={alt} />
                            ),
                          }}
                        >
                          {chatDisplayContent}
                        </ReactMarkdown>
                        {streaming && <span className="blinking-cursor"></span>}
                      </div>
                    ) : (
                      !status && (
                        <div className="typing-indicator-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <>
                    <p className="user-text-content">{displayContent}</p>
                    {attachments && attachments.length > 0 && (
                      <div className="message-attachments">
                        {attachments.map((attachment, idx) => {
                          const isImage = (
                            attachment.type ||
                            attachment.mimetype ||
                            ""
                          ).startsWith("image/");
                          return (
                            <div key={idx} className="attachment-item">
                              {isImage ? (
                                <img
                                  src={attachment.url || attachment.base64}
                                  alt={
                                    attachment.name || attachment.originalName
                                  }
                                  className="attachment-image-preview"
                                  onClick={() =>
                                    window.open(
                                      attachment.url || attachment.base64,
                                      "_blank",
                                    )
                                  }
                                />
                              ) : (
                                <div className="attachment-file-content">
                                  <span className="attachment-file-name">
                                    {attachment.name || attachment.originalName}
                                  </span>
                                  <span className="attachment-file-size">
                                    {attachment.size
                                      ? `${(attachment.size / 1024).toFixed(1)} KB`
                                      : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {displayContent && (
                <div className="message-actions">
                  {isAssistant ? (
                    <>
                      <button
                        className={`action-btn ${copied ? "copied" : ""}`}
                        onClick={handleCopy}
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? t("copied") : t("copy")}</span>
                      </button>
                      {messageIndex === totalMessages - 1 && (
                        <button
                          className="action-btn regenerate-btn"
                          onClick={handleRegenerateClick}
                          title={t("regenerate")}
                        >
                          <RotateCcw size={14} />
                          <span>{t("regenerate")}</span>
                        </button>
                      )}
                      <div className="message-toolbar-group export-menu-container">
                        <button
                          className="action-btn"
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          title={t("export") || "Export"}
                        >
                          <MoreVertical size={14} />
                        </button>

                        {showExportMenu && (
                          <div className="export-menu-dropdown">
                            <button
                              className="export-menu-item"
                              onClick={() => {
                                onExportPDF?.(messageIndex);
                                setShowExportMenu(false);
                              }}
                            >
                              <Download size={14} />
                              <span>PDF</span>
                            </button>
                            <button
                              className="export-menu-item"
                              onClick={() => {
                                onExportMarkdown?.();
                                setShowExportMenu(false);
                              }}
                            >
                              <FileCode size={14} />
                              <span>Markdown</span>
                            </button>
                            <button
                              className="export-menu-item"
                              onClick={() => {
                                onExportText?.();
                                setShowExportMenu(false);
                              }}
                            >
                              <FileText size={14} />
                              <span>Text</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <button
                      className="action-btn edit-btn"
                      onClick={handleEditClick}
                      title={t("edit")}
                    >
                      <Edit2 size={14} />
                      <span>{t("edit")}</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
