import {
  PlusCircle,
  MessageSquare,
  Menu,
  Settings,
  Globe,
  HelpCircle,
  TrendingUp,
  LogOut,
  ChevronDown,
  User,
  Trash2,
  Sparkles,
  Shield,
  Activity,
  LogIn,
  Search,
  Edit2,
  Check,
  X,
} from "lucide-react";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import LogoutConfirmationModal from "./LogoutConfirmationModal";
import "../styles/Sidebar.css";

const Sidebar = ({
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onToggleSidebar,
  sidebarOpen,

  onOpenSettings,
  currentLanguage = "en",
  onOpenLanguage,
  onOpenUserInfo,
  onOpenUpgrade,
  onOpenPrivacy,
}) => {
  const { user, logout, activePlan } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showChatsPanel, setShowChatsPanel] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // Check both user context and handling potential case sensitivity
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShowMenuDropdown(false);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/login");
  };

  const handleToggleSidebar = () => {
    setShowMenuDropdown(false);
    onToggleSidebar();
  };

  const handleStartRename = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat._id);
    setEditTitle(chat.title);
  };

  const handleSaveRename = (e, chatId) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle);
      setEditingChatId(null);
    }
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingChatId(null);
  };

  return (
    <>
      {/* Collapsed Icon Bar */}
      {!sidebarOpen && (
        <div className="sidebar-icon-bar">
          <button
            className="icon-btn expand-btn"
            onClick={handleToggleSidebar}
            title={t("openSidebar")}
          >
            <Menu size={24} />
          </button>

          <button
            className="icon-btn new-chat-icon"
            onClick={onNewChat}
            title={t("newChat")}
          >
            <PlusCircle size={24} />
          </button>

          <button
            className="icon-btn"
            onClick={() => setShowChatsPanel(!showChatsPanel)}
            title={t("chats")}
          >
            <MessageSquare size={24} />
          </button>

          {/* 👉 Renders for both Guests and Users */}
          <div className="icon-bar-footer">
            <button
              className="icon-user-btn"
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              title={user ? user.name : t("guestUser")}
            >
              <div className="user-avatar-small">
                {user?.name ? (
                  user.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                ) : (
                  <User size={16} />
                )}
              </div>
            </button>

            {showMenuDropdown && (
              <div className="icon-bar-menu-dropdown">
                {user ? (
                  /* --- LOGGED IN USER MENU --- */
                  <>
                    {isAdmin && (
                      <button
                        className="menu-item"
                        style={{ color: "#3b82f6", fontWeight: "bold" }}
                        onClick={() => {
                          setShowMenuDropdown(false);
                          navigate("/admin");
                        }}
                      >
                        <Activity size={18} />
                        <span>{t("adminConsole")}</span>
                      </button>
                    )}

                    <button
                      className="menu-item"
                      onClick={() => {
                        setShowMenuDropdown(false);
                        onOpenSettings();
                      }}
                    >
                      <Settings size={18} />
                      <span>{t("settings")}</span>
                    </button>
                    <button className="menu-item">
                      <HelpCircle size={18} />
                      <span>{t("getHelp")}</span>
                    </button>
                    <button
                      className="menu-item"
                      onClick={() => {
                        setShowMenuDropdown(false);
                        onOpenUpgrade();
                      }}
                    >
                      <TrendingUp size={18} />
                      <span>{t("upgradePlan")}</span>
                    </button>
                    <button
                      className="menu-item"
                      onClick={() => {
                        setShowMenuDropdown(false);
                        onOpenPrivacy && onOpenPrivacy();
                      }}
                    >
                      <Shield size={18} />
                      <span>{t("privacySecurity")}</span>
                    </button>
                    <div className="menu-divider"></div>
                    <button
                      className="menu-item logout-btn"
                      onClick={handleLogoutClick}
                    >
                      <LogOut size={18} />
                      <span>{t("logOut")}</span>
                    </button>
                  </>
                ) : (
                  /* --- GUEST MENU (ONLY SIGN IN) --- */
                  <button
                    className="menu-item"
                    style={{ color: "#10b981", fontWeight: "bold" }}
                    onClick={() => navigate("/login")}
                  >
                    <LogIn size={18} />
                    <span>{t("signIn")}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Sidebar */}
      {sidebarOpen && (
        <aside className="sidebar glass">
          <div className="sidebar-header">
            <h1 className="sidebar-title">Verity The ChatBot</h1>
            <button
              className="header-menu-btn"
              onClick={handleToggleSidebar}
              title="Menu"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="sidebar-nav">
            <button className="nav-item new-chat" onClick={onNewChat}>
              <PlusCircle size={20} />
              <span>{t("newChat")}</span>
            </button>

            <button
              className="nav-item"
              onClick={() => setShowChatsPanel(!showChatsPanel)}
            >
              <MessageSquare size={20} />
              <span>{t("chats")}</span>
            </button>
          </nav>

          {showChatsPanel && Array.isArray(chats) && chats.length > 0 && (
            <div className="sidebar-recents">
              <div className="recents-header">
                <h3>{t("recents")}</h3>
                <div className="search-container">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="sidebar-search-input"
                  />
                </div>
              </div>

              <div className="chat-list">
                {chats
                  .filter((chat) =>
                    chat.title.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .slice(0, 30)
                  .map((chat, index) => (
                    <div
                      key={chat._id}
                      className={`chat-item ${currentChatId === chat._id ? "active" : ""} ${editingChatId === chat._id ? "editing" : ""}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => onSelectChat(chat._id)}
                    >
                      {editingChatId === chat._id ? (
                        <div
                          className="chat-edit-container"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="chat-rename-input"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleSaveRename(e, chat._id);
                              if (e.key === "Escape") handleCancelRename(e);
                            }}
                          />
                          <button
                            className="chat-rename-btn chat-save-btn"
                            onClick={(e) => handleSaveRename(e, chat._id)}
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="chat-rename-btn chat-cancel-btn"
                            onClick={handleCancelRename}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="chat-title">{chat.title}</span>
                          <div className="chat-actions">
                            <button
                              className="chat-rename-btn"
                              onClick={(e) => handleStartRename(e, chat)}
                              title="Rename chat"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="chat-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteChat(chat._id);
                              }}
                              title="Delete chat"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 👉 Renders for both Guests and Users */}
          <div className="sidebar-footer">
            <div
              className="menu-dropdown-container"
              style={{ position: "relative", width: "100%" }}
            >
              <button
                className="user-info"
                onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              >
                <div className="user-avatar">
                  {user ? (
                    user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="user-details">
                  <div className="user-name">
                    {user ? user.name : t("guestUser")}
                  </div>
                  <div className="user-plan">
                    {user
                      ? activePlan
                        ? activePlan.name
                        : t("freePlan")
                      : t("notLoggedIn")}
                  </div>
                </div>
                <ChevronDown size={16} className="menu-toggle-icon" />
              </button>

              {showMenuDropdown && (
                <div className="menu-dropdown">
                  {user ? (
                    /* --- LOGGED IN USER MENU --- */
                    <>
                      {isAdmin && (
                        <button
                          className="menu-item menu-item-admin"
                          onClick={() => {
                            setShowMenuDropdown(false);
                            navigate("/admin");
                          }}
                        >
                          <Activity size={18} />
                          <span>{t("adminConsole")}</span>
                        </button>
                      )}

                      <button
                        className="menu-item"
                        onClick={() => {
                          setShowMenuDropdown(false);
                          onOpenSettings();
                        }}
                      >
                        <Settings size={18} />
                        <span>{t("settings")}</span>
                      </button>

                      <button
                        className="menu-item"
                        onClick={() => {
                          setShowMenuDropdown(false);
                          onOpenUserInfo && onOpenUserInfo();
                        }}
                      >
                        <User size={18} />
                        <span>{t("myProfile")}</span>
                      </button>

                      <button
                        className="menu-item"
                        onClick={() => {
                          setShowMenuDropdown(false);
                          onOpenLanguage && onOpenLanguage();
                        }}
                      >
                        <Globe size={18} />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            alignItems: "center",
                          }}
                        >
                          <span>{t("language")}</span>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              background: "rgba(16, 185, 129, 0.2)",
                              color: "#10b981",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {currentLanguage.toUpperCase()}
                          </span>
                        </div>
                      </button>

                      <button
                        className="menu-item"
                        onClick={() => {
                          setShowMenuDropdown(false);
                          onOpenUpgrade();
                        }}
                      >
                        <TrendingUp size={18} />
                        <span>{t("upgradePlan")}</span>
                      </button>
                      <button
                        className="menu-item"
                        onClick={() => {
                          setShowMenuDropdown(false);
                          onOpenPrivacy && onOpenPrivacy();
                        }}
                      >
                        <Shield size={18} />
                        <span>{t("privacySecurity")}</span>
                      </button>
                      <div className="menu-divider"></div>
                      <button
                        className="menu-item logout-btn"
                        onClick={handleLogoutClick}
                      >
                        <LogOut size={18} />
                        <span>{t("logOut")}</span>
                      </button>
                    </>
                  ) : (
                    /* --- GUEST MENU (ONLY SIGN IN) --- */
                    <button
                      className="menu-item"
                      style={{ color: "#10b981", fontWeight: "bold" }}
                      onClick={() => navigate("/login")}
                    >
                      <LogIn size={18} />
                      <span>{t("signIn")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        userName={user?.name}
      />
    </>
  );
};
export default Sidebar;
