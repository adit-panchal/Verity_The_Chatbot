import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ArrowDown,
  Square,
  Plus,
  ArrowUp,
  X,
  Image as ImageIcon,
  File as FileIcon,
  Zap,
  Lock,
  ChevronUp,
  Wand2,
} from "lucide-react";
import Message from "./Message";
import Loader from "./Loader";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import "../styles/ChatBox.css";
import "../styles/CompactSelector.css";

const ChatBox = ({
  currentChat,
  onSendMessage,
  loading,
  isStreaming,
  onStopGeneration,
  onExportMarkdown,
  onExportText,
  onExportPDF,
  onEditMessage,
  onRegenerateMessage,
  selectedModel = "gpt-3.5-turbo",
  onModelChange,
  onOpenUpgrade,
}) => {
  const { user, activePlan } = useAuth();
  const { t } = useLanguage();
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Ultra-smooth bottom chase logic
  useEffect(() => {
    let rafId;
    const container = containerRef.current;
    if (!container || !isStreaming) return;

    const chaseBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const targetScroll = Math.max(0, scrollHeight - clientHeight);
      const distance = targetScroll - scrollTop;

      // BROADER THRESHOLD: Chases if within 600px of bottom, OR if we are at the very top (new chat).
      // This ensures the scroller doesn't get "stuck" when a message is first generated.
      const isNearBottom = distance < 600 || scrollTop === 0;

      if (isNearBottom && distance > 0.5) {
        // Smoothly interp towards target (Lerp: 20% of distance per frame + small step)
        container.scrollTop = scrollTop + distance * 0.2 + 0.5;
        rafId = requestAnimationFrame(chaseBottom);
      } else if (isNearBottom && distance > 0) {
        container.scrollTop = targetScroll;
        rafId = requestAnimationFrame(chaseBottom);
      } else if (isNearBottom) {
        // Keep checking for content changes while streaming
        rafId = requestAnimationFrame(chaseBottom);
      }
    };

    rafId = requestAnimationFrame(chaseBottom);
    return () => cancelAnimationFrame(rafId);
  }, [isStreaming, currentChat?.messages]);

  // Standard scroll for manual triggers (New chat, etc)
  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Initial scroll for new messages (not streaming)

  // Initial scroll for new messages (not streaming)
  useEffect(() => {
    if (!isStreaming && currentChat?.messages?.length > 0) {
      scrollToBottom("smooth");
    }
  }, [currentChat?.messages?.length, isStreaming]);

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Show button if we are more than 300px away from bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 300;
    setShowScrollBtn(!isAtBottom);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !loading) {
      onSendMessage(input, false, attachedFiles);
      setInput("");
      setAttachedFiles([]);
    }
  };

  // Auto-resize input
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles([...attachedFiles, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowFileMenu(false);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const newFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          newFiles.push(file);
        }
      }
    }

    if (newFiles.length > 0) {
      e.preventDefault();
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon size={16} />;
    }
    return <FileIcon size={16} />;
  };

  const getFilePreview = (file) => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  return (
    <div className="chat-box glass">
      <div
        className="messages-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {currentChat ? (
          <div className="messages-list">
            {currentChat?.messages?.map((msg, index) => (
              <Message
                key={index}
                role={msg.role}
                content={msg.content}
                streaming={msg.streaming}
                status={msg.status}
                messageIndex={index}
                totalMessages={currentChat.messages?.length || 0}
                onEdit={onEditMessage}
                onRegenerate={onRegenerateMessage}
                onExportMarkdown={onExportMarkdown}
                onExportText={onExportText}
                onExportPDF={onExportPDF}
                attachments={msg.attachments}
              />
            ))}
            {loading && <Loader />}
          </div>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content fade-in">
              <div className="ai-icon-large">
                <Sparkles size={48} />
              </div>
              <h1>
                {t("welcomeMessage").replace(
                  "{name}",
                  user?.nickname || user?.name?.split(" ")[0] || "",
                )}
              </h1>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <button
          className="scroll-bottom-btn fade-in"
          onClick={() => scrollToBottom("smooth")}
        >
          <ArrowDown size={18} />
        </button>
      )}

      {currentChat && currentChat.messages?.length > 0 && (
        <div className="export-area"></div>
      )}

      <div className="input-area">
        <form onSubmit={handleSubmit} className="input-container">
          {attachedFiles.length > 0 && (
            <div className="attached-files">
              <div className="attached-files-grid">
                {attachedFiles.map((file, index) => {
                  const preview = getFilePreview(file);
                  return (
                    <div key={index} className="attached-file">
                      {preview ? (
                        <img
                          src={preview}
                          alt={file.name}
                          className="file-preview-img"
                        />
                      ) : (
                        <div className="file-preview-icon">
                          {getFileIcon(file)}
                        </div>
                      )}
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeAttachedFile(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            rows="1"
            placeholder={t("inputPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={loading}
          />
          <div className="input-footer">
            <div className="input-actions-left">
              <div className="file-menu-wrapper">
                <button
                  type="button"
                  className={`input-action-btn ${!activePlan || activePlan.id === "free" ? "disabled" : ""}`}
                  title={
                    !activePlan || activePlan.id === "free"
                      ? "Upgrade to allow uploads"
                      : t("uploadFiles")
                  }
                  onClick={() => {
                    if (!activePlan || activePlan.id === "free") {
                      onOpenUpgrade && onOpenUpgrade();
                    } else {
                      setShowFileMenu(!showFileMenu);
                    }
                  }}
                >
                  <Plus size={20} />
                </button>
                {showFileMenu && (
                  <div className="file-menu-card">
                    <button
                      type="button"
                      className="file-menu-option"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon size={20} />
                      <div className="file-menu-text">
                        <span className="file-menu-title">
                          {t("uploadFiles")}
                        </span>
                        <span className="file-menu-subtitle">
                          {t("uploadDevice")}
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="input-action-btn"
                title="Generate Image"
                onClick={() => {
                  setInput("/image ");
                  textareaRef.current?.focus();
                }}
              >
                <Wand2 size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>
            <div className="input-actions-right">
              <div className="model-selector-compact">
                <button
                  type="button"
                  className="model-toggle-btn"
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  title="Change Model"
                >
                  <span className="current-model-name">
                    {selectedModel === "gpt-4" ? "3.3" : "3.1"}
                  </span>
                  <ChevronUp
                    size={14}
                    className={`model-chevron ${showModelMenu ? "open" : ""}`}
                  />
                </button>

                {showModelMenu && (
                  <div className="model-dropdown-menu">
                    <button
                      type="button"
                      className={`model-menu-item ${selectedModel === "gpt-3.5-turbo" ? "active" : ""}`}
                      onClick={() => {
                        onModelChange && onModelChange("gpt-3.5-turbo");
                        setShowModelMenu(false);
                      }}
                    >
                      <div className="model-item-left">
                        <Sparkles size={14} />
                        Llama 3.1
                      </div>
                      <span className="model-tag">Fast</span>
                    </button>

                    <button
                      type="button"
                      className={`model-menu-item ${selectedModel === "gpt-4" ? "active" : ""}`}
                      onClick={() => {
                        if (!activePlan || activePlan.id === "free") {
                          onOpenUpgrade && onOpenUpgrade();
                          setShowModelMenu(false);
                        } else {
                          onModelChange && onModelChange("gpt-4");
                          setShowModelMenu(false);
                        }
                      }}
                    >
                      <div className="model-item-left">
                        <Zap size={14} />
                        Llama 3.3
                      </div>
                      {!activePlan || activePlan.id === "free" ? (
                        <Lock size={12} className="lock-icon-menu" />
                      ) : (
                        <span className="model-tag">Pro</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
              {isStreaming ? (
                <button
                  type="button"
                  className="stop-btn"
                  onClick={onStopGeneration}
                >
                  <Square size={20} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="send-btn"
                  disabled={
                    (!input.trim() && attachedFiles.length === 0) || loading
                  }
                >
                  <ArrowUp size={20} />
                </button>
              )}
            </div>
          </div>
        </form>
        <p className="ai-disclaimer">{t("aiDisclaimer")}</p>
      </div>
    </div>
  );
};

export default ChatBox;
