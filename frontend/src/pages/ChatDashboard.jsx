import { useState, useEffect } from "react";
import { Menu, TrendingUp } from "lucide-react"; // 👉 Added TrendingUp here!
import { useLanguage } from "../context/LanguageContext";
import { chatService, UPLOADS_BASE_PATH } from "../services/api";
import {
  exportChatAsMarkdown,
  exportChatAsText,
  exportChatAsPDF,
} from "../utils/exportChat";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/ChatBox";
import SettingsModal from "../components/SettingsModal";
import LanguageSelector from "../components/LanguageSelector";
import UserInfoModal from "../components/UserInfoModal";
import UpgradeModal from "../components/UpgradeModal";
import PrivacySettingsModal from "../components/PrivacySettingsModal";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { useAuth } from "../context/AuthContext";
import "../styles/ChatDashboard.css";

const PLAN_LIMITS = {
  free: { maxMessages: 10, allowUploads: false, allowGpt4: false },
  pro: { maxMessages: 100, allowUploads: true, allowGpt4: true },
  enterprise: { maxMessages: Infinity, allowUploads: true, allowGpt4: true },
};

const ChatDashboard = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const { user, activePlan, loading: authLoading } = useAuth();

  // Initialize model from localStorage or default to basic
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("selectedModel") || "gpt-3.5-turbo";
  });

  // Persist model selection
  useEffect(() => {
    if (selectedModel) {
      localStorage.setItem("selectedModel", selectedModel);
    }
  }, [selectedModel]);

  // Validate model against plan (revert if plan expires)
  useEffect(() => {
    if (authLoading) return;

    if (
      (!activePlan || activePlan.id === "free") &&
      selectedModel === "gpt-4"
    ) {
      setSelectedModel("gpt-3.5-turbo");
    }
  }, [activePlan, selectedModel, authLoading]);

  // App State
  const { language: currentLanguage, changeLanguage: setCurrentLanguage } =
    useLanguage();

  // Responsive State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  // 👉 Updated to check if user exists BEFORE fetching!
  useEffect(() => {
    // Only fetch past chats if someone is actually logged in
    if (user) {
      fetchChats();
    }

    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Close sidebar on mobile by default
      } else {
        setSidebarOpen(true); // Open sidebar on desktop
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [user]);

  useEffect(() => {
    if (currentChatId && !isStreaming) {
      fetchChatById(currentChatId);
      if (isMobile) setSidebarOpen(false);
    } else if (!currentChatId) {
      setCurrentChat(null);
    }
  }, [currentChatId, isStreaming, isMobile]);

  const fetchChats = async () => {
    try {
      const { data } = await chatService.getChats();
      setChats(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load chats");
    }
  };

  const fetchChatById = async (id) => {
    try {
      setLoading(true);
      const { data } = await chatService.getChatById(id);

      // Process attachments to include full URL
      if (data && data.messages) {
        data.messages.forEach((msg) => {
          if (msg.attachments) {
            msg.attachments.forEach((att) => {
              if (att.filename && !att.url) {
                // Ensure we don't overwrite if already present
                att.url = `${UPLOADS_BASE_PATH}/${att.filename}`;
              }
            });
          }
        });
      }

      setCurrentChat(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load chat details");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setCurrentChat(null);
    if (isMobile) setSidebarOpen(false);
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleSendMessage = async (message, useSearch = false, files = []) => {
    // 1. Check Plan Limits
    const planKey = activePlan?.id || "free";
    const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

    // Check Message Limit
    const today = new Date().toDateString();
    const storedCount = JSON.parse(
      localStorage.getItem("dailyMessageCount") || "{}",
    );
    const currentCount = storedCount[today] || 0;

    if (currentCount >= limits.maxMessages) {
      setError("RATE_LIMIT: Daily message limit reached.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setIsStreaming(true);

      // Increment local counter
      storedCount[today] = currentCount + 1;
      localStorage.setItem("dailyMessageCount", JSON.stringify(storedCount));

      // Create new AbortController for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Process attachments
      const attachments = files.map((file) => ({
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        url: URL.createObjectURL(file), // Generate Blob URL for preview
      }));

      // Optimistic Update
      const userMessage = { role: "user", content: message, attachments };
      const placeholderAssistant = {
        role: "assistant",
        content: "",
        streaming: true,
      };

      setCurrentChat((prev) => {
        const prevMessages = prev?.messages || [];
        // If prev is null, we shouldn't spread it. Use an object literal for new chats.
        const baseChat = prev || { messages: [] };
        return {
          ...baseChat,
          messages: [...prevMessages, userMessage, placeholderAssistant],
        };
      });

      const token = user?.token || "";

      // Use FormData if files are present
      let body;
      let headers = {
        Authorization: `Bearer ${token}`,
      };

      if (files && files.length > 0) {
        body = new FormData();
        body.append("message", message);
        if (currentChatId) body.append("chatId", currentChatId);
        body.append("useSearch", useSearch);
        body.append("language", currentLanguage);
        files.forEach((file) => {
          body.append("files", file);
        });
        // Don't set Content-Type header for FormData, browser will set it with boundary
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          message,
          chatId: currentChatId,
          useSearch,
          language: currentLanguage,
          model: selectedModel, // Pass the selected model
        });
      }

      const response = await fetch(`${API_BASE_PATH}/chats`, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      // 👉 Updated to intercept Rate Limit specifically
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new Error(
            `RATE_LIMIT:${errorData.error || "Hourly limit reached."}`,
          );
        }

        throw new Error(
          errorData.message ||
            `HTTP ${response.status}: Failed to send message`,
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantText = "";
      let buffer = ""; // Added buffer for streaming
      let lastUpdateTime = 0;
      const THROTTLE_MS = 80; // Only update UI every 80ms for stability

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";

        for (const msg of messages) {
          const line = msg.trim();
          if (line.startsWith("data: ")) {
            try {
              const dataStr = line.substring(6);
              if (!dataStr || dataStr === "[DONE]") continue;
              const data = JSON.parse(dataStr);

              if (data.type === "start") {
                if (!currentChatId) {
                  setCurrentChatId(data.chatId);
                  fetchChats();
                }
              } else if (data.type === "search_start") {
                setCurrentChat((prev) => {
                  if (!prev || !Array.isArray(prev.messages)) return prev;
                  const newMessages = [...prev.messages];
                  const lastIdx = newMessages.length - 1;
                  newMessages[lastIdx] = {
                    ...newMessages[lastIdx],
                    status: "searching",
                  };
                  return { ...prev, messages: newMessages };
                });
              } else if (data.type === "search_complete") {
                setCurrentChat((prev) => {
                  if (!prev || !Array.isArray(prev.messages)) return prev;
                  const newMessages = [...prev.messages];
                  const lastIdx = newMessages.length - 1;
                  newMessages[lastIdx] = {
                    ...newMessages[lastIdx],
                    status: "generating",
                    searchResults: data.results,
                  };
                  return { ...prev, messages: newMessages };
                });
              } else if (data.type === "chunk") {
                assistantText += data.chunk;

                // Throttle UI updates to prevent "unstable" jumping
                const now = Date.now();
                if (now - lastUpdateTime > THROTTLE_MS) {
                  lastUpdateTime = now;
                  setCurrentChat((prev) => {
                    if (!prev || !Array.isArray(prev.messages)) return prev;
                    const newMessages = [...prev.messages];
                    if (newMessages.length > 0) {
                      const lastIdx = newMessages.length - 1;
                      newMessages[lastIdx] = {
                        ...newMessages[lastIdx],
                        content: assistantText,
                        streaming: true,
                        status: null,
                      };
                    }
                    return { ...prev, messages: newMessages };
                  });
                }
              } else if (data.type === "done") {
                setCurrentChat((prev) => {
                  if (!prev || !Array.isArray(prev.messages)) return prev;
                  const newMessages = [...prev.messages];
                  if (newMessages.length > 0) {
                    const lastIdx = newMessages.length - 1;
                    newMessages[lastIdx] = {
                      ...newMessages[lastIdx],
                      content: assistantText,
                      streaming: false,
                      status: null,
                    };
                  }
                  return { ...prev, messages: newMessages };
                });
              } else if (data.type === "error") {
                setError(data.error);
                setLoading(false);
                setIsStreaming(false);
              }
            } catch (e) {
              console.error("Parse error in stream:", e, "Raw:", line);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Generation stopped");
      } else {
        setError(err.message || "Failed to send message");
      }
    } finally {
      setAbortController(null);
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleDeleteChat = (id) => {
    const chat = chats.find((c) => c._id === id);
    setChatToDelete(chat);
    setShowDeleteModal(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    try {
      await chatService.deleteChat(chatToDelete._id);
      setChats(chats.filter((c) => c._id !== chatToDelete._id));
      if (currentChatId === chatToDelete._id) setCurrentChatId(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete chat");
    } finally {
      setShowDeleteModal(false);
      setChatToDelete(null);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Clear all chat history?")) {
      try {
        await chatService.clearChats();
        setChats([]);
        setCurrentChatId(null);
      } catch (err) {
        console.error(err);
        setError("Failed to clear history");
      }
    }
  };

  const handleExportAsMarkdown = () => {
    if (currentChat && currentChat.messages.length > 0) {
      const chatTitle = currentChat.title || "Chat";
      exportChatAsMarkdown(currentChat.messages, chatTitle);
    }
  };

  const handleExportAsText = () => {
    if (currentChat && currentChat.messages.length > 0) {
      const chatTitle = currentChat.title || "Chat";
      exportChatAsText(currentChat.messages, chatTitle);
    }
  };

  const handleExportAsPDF = async (messageIndex) => {
    if (currentChat && currentChat.messages.length > 0) {
      const chatTitle = currentChat.title || "Solution";

      // If a specific message is selected (e.g., via the PDF button on a message), export only that.
      // otherwise export the whole chat.
      let messagesToExport = currentChat.messages;

      if (typeof messageIndex === "number" && messageIndex >= 0) {
        // We only want the specific message.
        // If it's an assistant message, it likely contains the full solution.
        messagesToExport = [currentChat.messages[messageIndex]];
      }

      await exportChatAsPDF(messagesToExport, chatTitle);
    }
  };

  const handleEditMessage = (messageIndex, newContent) => {
    setCurrentChat((prev) => {
      if (!prev || !Array.isArray(prev.messages)) return prev;
      const newMessages = [...prev.messages];
      newMessages[messageIndex] = {
        ...newMessages[messageIndex],
        content: newContent,
      };
      return { ...prev, messages: newMessages };
    });
  };

  const handleRegenerateMessage = async (messageIndex) => {
    try {
      // Get the user message before the assistant message
      if (messageIndex === 0) return;

      const userMessageIndex = messageIndex - 1;
      if (currentChat.messages[userMessageIndex].role !== "user") return;

      const userMessage = currentChat.messages[userMessageIndex].content;

      setLoading(true);
      setError("");
      setIsStreaming(true);

      // Create new AbortController for this request
      const controller = new AbortController();
      setAbortController(controller);

      // Remove the old assistant message and add a new placeholder
      setCurrentChat((prev) => {
        if (!prev || !Array.isArray(prev.messages)) return prev;
        const newMessages = prev.messages.slice(0, messageIndex);
        newMessages.push({
          role: "assistant",
          content: "",
          streaming: true,
        });
        return { ...prev, messages: newMessages };
      });

      const token = user?.token || "";

      const response = await fetch(`${API_BASE_PATH}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage, chatId: currentChatId }),
        signal: controller.signal,
      });

      // 👉 Updated to intercept Rate Limit specifically
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(
            `RATE_LIMIT:${errorData.error || "Hourly limit reached."}`,
          );
        }
        throw new Error(errorData.message || "Failed to regenerate message");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let assistantText = "";
      let buffer = ""; // Added buffer for streaming

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || "";

        for (const msg of messages) {
          const line = msg.trim();
          if (line.startsWith("data: ")) {
            try {
              const dataStr = line.substring(6);
              if (!dataStr || dataStr === "[DONE]") continue;
              const data = JSON.parse(dataStr);

              if (data.type === "chunk") {
                assistantText += data.chunk;
                setCurrentChat((prev) => {
                  if (!prev || !Array.isArray(prev.messages)) return prev;
                  const newMessages = [...prev.messages];
                  if (newMessages.length > 0) {
                    const lastIdx = newMessages.length - 1;
                    newMessages[lastIdx] = {
                      ...newMessages[lastIdx],
                      content: assistantText,
                      streaming: true,
                    };
                  }
                  return { ...prev, messages: newMessages };
                });
              } else if (data.type === "done") {
                setCurrentChat((prev) => {
                  if (!prev || !Array.isArray(prev.messages)) return prev;
                  const newMessages = [...prev.messages];
                  if (newMessages.length > 0) {
                    const lastIdx = newMessages.length - 1;
                    newMessages[lastIdx] = {
                      ...newMessages[lastIdx],
                      content: assistantText,
                      streaming: false,
                    };
                  }
                  return { ...prev, messages: newMessages };
                });
              } else if (data.type === "error") {
                setError(data.error);
              }
            } catch (e) {
              console.error("Parse error in stream:", e, "Raw:", line);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Regeneration stopped");
      } else {
        setError(err.message || "Failed to regenerate message");
      }
    } finally {
      setAbortController(null);
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const getDisplayTitle = () => {
    if (!currentChat || !currentChat.title) return "Verity The ChatBot";
    // Truncate to 20 characters for better mobile visibility
    const title = currentChat.title;
    return title.length > 20 ? title.substring(0, 20) + "..." : title;
  };

  const handleRenameChat = async (id, newTitle) => {
    try {
      await chatService.updateChat(id, newTitle);
      setChats(
        chats.map((c) => (c._id === id ? { ...c, title: newTitle } : c)),
      );
      if (currentChat && currentChat._id === id) {
        setCurrentChat({ ...currentChat, title: newTitle });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to rename chat");
    }
  };

  return (
    <div
      className={`dashboard-container ${!sidebarOpen ? "sidebar-collapsed" : ""}`}
    >
      <div className="dashboard-main">
        {isMobile && (
          <div
            className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div className={`sidebar-container ${sidebarOpen ? "open" : ""}`}>
          <Sidebar
            chats={chats}
            currentChatId={currentChatId}
            onSelectChat={setCurrentChatId}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onClearHistory={handleClearHistory}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
            onOpenSettings={() => setShowSettings(true)}
            currentLanguage={currentLanguage}
            onOpenLanguage={() => setShowLanguageModal(true)}
            onOpenUserInfo={() => setShowUserInfoModal(true)}
            onOpenUpgrade={() => setShowUpgradeModal(true)}
            onOpenPrivacy={() => setShowPrivacyModal(true)}
          />
        </div>
        <main className="chat-area">
          {isMobile && (
            <div className="mobile-project-title">
              <button
                className="mobile-sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <Menu size={20} />
              </button>
              <span className="title-text">{getDisplayTitle()}</span>
            </div>
          )}

          {/* 👉 Updated elegant rate limit banner */}
          {error && (
            <div
              className={`error-banner ${error.startsWith("RATE_LIMIT:") ? "rate-limit-banner" : ""}`}
            >
              <span>
                {error.startsWith("RATE_LIMIT:")
                  ? error.split("RATE_LIMIT:")[1]
                  : error}
              </span>

              {/* Show the Upgrade button ONLY if it's a rate limit error */}
              {error.startsWith("RATE_LIMIT:") && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="banner-upgrade-btn"
                >
                  <TrendingUp size={16} />
                  Upgrade to Pro
                </button>
              )}
            </div>
          )}

          <ChatBox
            currentChat={currentChat}
            onSendMessage={handleSendMessage}
            loading={loading}
            isStreaming={isStreaming}
            onStopGeneration={handleStopGeneration}
            onExportMarkdown={handleExportAsMarkdown}
            onExportText={handleExportAsText}
            onExportPDF={handleExportAsPDF}
            onEditMessage={handleEditMessage}
            onRegenerateMessage={handleRegenerateMessage}
            // New Props for Plan Features
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onOpenUpgrade={() => setShowUpgradeModal(true)}
          />
        </main>
      </div>
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <LanguageSelector
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
      />
      <UserInfoModal
        isOpen={showUserInfoModal}
        onClose={() => setShowUserInfoModal(false)}
        currentLanguage={currentLanguage}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
      <PrivacySettingsModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setChatToDelete(null);
        }}
        onConfirm={confirmDeleteChat}
        chatTitle={chatToDelete?.title}
      />
    </div>
  );
};

export default ChatDashboard;
