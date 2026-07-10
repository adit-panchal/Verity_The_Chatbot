import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { settingsService } from "../services/api";
import "../styles/SettingsModal.css";

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("General");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "[NAME]",
    email: "[EMAIL_ADDRESS]",
    nickname: "[NICKNAME]",
    workType: "[WORKTYPE]",
    preferences: "[PREFERENCES]",
    notifications: true,
    theme: "dark",
    language: "en",
    encryptionEnabled: true,
    collectAnalytics: true,
  });

  // Theme handling
  const handleThemeChange = (theme) => {
    setFormData((prev) => ({ ...prev, theme }));

    if (theme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light",
      );
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    localStorage.setItem("theme", theme);
  };

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light",
      );
    } else {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
    setFormData((prev) => ({ ...prev, theme: savedTheme }));
  }, []);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        nickname: user.nickname || user.name?.split(" ")[0] || "",
        workType: user.workType || "Engineering",
        preferences: user.preferences || "",
        notifications:
          user.notifications !== undefined ? user.notifications : true,
        encryptionEnabled: user.privacySettings?.encryptionEnabled ?? true,
        collectAnalytics: user.privacySettings?.collectAnalytics ?? true,
      }));
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (success) setSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        workType: formData.workType,
        nickname: formData.nickname,
        preferences: formData.preferences,
        notifications: formData.notifications,
        theme: formData.theme,
        language: formData.language,
        encryptionEnabled: formData.encryptionEnabled,
        collectAnalytics: formData.collectAnalytics,
      };
      console.log("Saving changes with payload:", payload);

      const { data } = await settingsService.updateSettings(payload);

      console.log("Save successful, updated user:", data);
      updateUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "General", label: t("general") },
    { id: "Account", label: t("account") },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "General":
        return (
          <div className="settings-panel">
            <h2 className="settings-header">{t("general")}</h2>

            {/* Profile Section */}
            <div className="settings-section">
              <h3 className="settings-section-title">{t("profile")}</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>{t("fullName")}</label>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#333",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        zIndex: 2,
                      }}
                    >
                      {formData.name
                        ? formData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "??"}
                    </div>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      value={formData.name}
                      onChange={handleChange}
                      style={{ paddingLeft: "42px" }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t("nicknameLabel")}</label>
                  <input
                    type="text"
                    name="nickname"
                    className="form-input"
                    value={formData.nickname}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label>{t("workTypeLabel")}</label>
                <select
                  name="workType"
                  className="form-select"
                  value={formData.workType}
                  onChange={handleChange}
                >
                  <option value="Engineering">{t("engineering")}</option>
                  <option value="Design">{t("design")}</option>
                  <option value="Product">{t("product")}</option>
                  <option value="Marketing">{t("marketing")}</option>
                  <option value="Other">{t("other")}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t("preferencesLabel")}</label>
                <p className="input-helper" style={{ margin: "0 0 8px" }}>
                  {t("preferencesHelper")}
                </p>
                <textarea
                  name="preferences"
                  className="form-textarea"
                  value={formData.preferences}
                  onChange={handleChange}
                  placeholder="e.g. keep explanations brief and to the point"
                ></textarea>
              </div>
            </div>

            {/* Language Section */}
            <div className="settings-section">
              <h3 className="settings-section-title">{t("language")}</h3>
              <div className="toggle-switch-container">
                <div className="toggle-label">
                  <h4>{t("autoTranslate")}</h4>
                  <p>{t("autoTranslateDesc")}</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.autoTranslate || false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        autoTranslate: e.target.checked,
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <hr
              style={{
                borderColor: "rgba(255,255,255,0.05)",
                margin: "30px 0",
              }}
            />

            {/* Notifications Section */}
            <div className="settings-section">
              <h3 className="settings-section-title">{t("notifications")}</h3>
              <div className="toggle-switch-container">
                <div className="toggle-label">
                  <h4>{t("responseCompletions")}</h4>
                  <p>{t("responseCompletionsDesc")}</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="notifications"
                    checked={formData.notifications}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notifications: e.target.checked,
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <hr
              style={{
                borderColor: "rgba(255,255,255,0.05)",
                margin: "30px 0",
              }}
            />

            {/* Appearance Section */}
            <div className="settings-section">
              <h3 className="settings-section-title">{t("appearance")}</h3>
              <div className="form-group">
                <label style={{ display: "block", marginBottom: "12px" }}>
                  {t("colorMode")}
                </label>
                <div className="appearance-options">
                  <div
                    className={`appearance-card ${formData.theme === "light" ? "active" : ""}`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <div className="appearance-preview preview-light">
                      <div className="check-badge">
                        <Check size={12} />
                      </div>
                    </div>
                    <div className="appearance-label">{t("light")}</div>
                  </div>
                  <div
                    className={`appearance-card ${formData.theme === "dark" ? "active" : ""}`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <div className="appearance-preview preview-dark">
                      <div className="check-badge">
                        <Check size={12} />
                      </div>
                    </div>
                    <div className="appearance-label">{t("dark")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "Account":
        return (
          <div className="settings-panel">
            <h2 className="settings-header">{t("account")}</h2>
            <div className="settings-section">
              <div className="form-group">
                <label>{t("emailAddress")}</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        );
      case "Privacy":
        return (
          <div className="settings-panel">
            <h2 className="settings-header">{t("privacy") || "Privacy"}</h2>
            <div className="settings-section">
              <h3 className="settings-section-title">
                {t("dataPrivacy") || "Data & Privacy"}
              </h3>

              <div className="toggle-switch-container">
                <div className="toggle-label">
                  <h4>{t("encryption") || "End-to-End Encryption"}</h4>
                  <p>
                    {t("encryptionDesc") ||
                      "Encrypt your chat data for enhanced security."}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.encryptionEnabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        encryptionEnabled: e.target.checked,
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-switch-container">
                <div className="toggle-label">
                  <h4>{t("analytics") || "Share Analytics"}</h4>
                  <p>
                    {t("analyticsDesc") ||
                      "Help improve the app by sharing anonymous usage data."}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.collectAnalytics}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        collectAnalytics: e.target.checked,
                      }))
                    }
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal" ref={modalRef}>
        <button className="close-settings-btn" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "var(--text-primary)",
                margin: 0,
              }}
            >
              {t("settings")}
            </h3>
          </div>
          <nav className="settings-sidebar-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div
          className="settings-content"
          style={{ display: "flex", flexDirection: "column", padding: 0 }}
        >
          <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
            {error && (
              <div
                style={{
                  color: "#ef4444",
                  background: "rgba(239, 68, 68, 0.1)",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </div>
            )}
            {renderContent()}
          </div>
          <div className="settings-footer">
            <button className="cancel-btn" onClick={onClose} disabled={loading}>
              {t("cancel")}
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                t("saving")
              ) : success ? (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Check size={16} /> {t("saved")}
                </span>
              ) : (
                t("saveChanges")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
