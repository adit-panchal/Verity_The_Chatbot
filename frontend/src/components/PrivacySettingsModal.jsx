import React, { useState, useEffect } from "react";
import {
  Shield,
  Lock,
  Smartphone,
  Database,
  Download,
  Trash2,
  X,
  Key,
  Globe,
} from "lucide-react";
import { privacyService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PasswordUpdateModal from "./PasswordUpdateModal";
import "../styles/PrivacySettingsModal.css";

const PrivacySettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("storage");
  const { user, updateUser, logout } = useAuth();
  const [settings, setSettings] = useState({
    retentionDays: 365,
    encryptionEnabled: true,
    twoFactorEnabled: false,
  });
  const [loading, setLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (user?.privacySettings) {
      setSettings((prev) => ({
        ...prev,
        ...user.privacySettings,
        retentionDays: user.privacySettings.dataRetentionDays || 365,
        twoFactorEnabled: user.twoFactorEnabled || false,
      }));
    }
  }, [user]);

  const handleToggleEncryption = async () => {
    try {
      setLoading(true);
      const res = await privacyService.toggleEncryption();
      setSettings((prev) => ({
        ...prev,
        encryptionEnabled: res.data.encryptionEnabled,
      }));
      // Update global user context as well
      if (user) {
        updateUser({
          privacySettings: {
            ...user.privacySettings,
            encryptionEnabled: res.data.encryptionEnabled,
          },
        });
      }
    } catch (err) {
      console.error("Failed to toggle encryption", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetentionChange = (e) => {
    const days = parseInt(e.target.value);
    setSettings((prev) => ({ ...prev, retentionDays: days }));
  };

  const handleRetentionCommit = async (e) => {
    const days = parseInt(e.target.value);
    // Update local state immediately
    setSettings((prev) => ({ ...prev, retentionDays: days }));

    try {
      await privacyService.updateRetention(days);
      // CRITICAL: Update global context to prevent useEffect from resetting state
      if (user) {
        updateUser({
          privacySettings: {
            ...user.privacySettings,
            dataRetentionDays: days,
          },
        });
      }
    } catch (err) {
      console.error("Failed to update retention", err);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await privacyService.exportData();
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute(
        "download",
        `Verity The ChatBot_export_${Date.now()}.json`,
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      await privacyService.deleteAccount();
      logout();
      window.location.href = "/login";
    } catch (err) {
      console.error("Delete account failed", err);
      // Optional: show error message to user
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="privacy-overlay">
      <div className="privacy-modal">
        {/* Header */}
        <div className="privacy-header">
          <h2>
            <Shield size={24} className="text-primary" />
            Privacy & Security Center
          </h2>
          <button className="close-privacy-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="privacy-content">
          {/* Sidebar */}
          <div className="privacy-sidebar">
            <button
              className={`privacy-nav-item ${activeTab === "storage" ? "active" : ""}`}
              onClick={() => setActiveTab("storage")}
            >
              <Database size={18} /> Data & Storage
            </button>
            <button
              className={`privacy-nav-item ${activeTab === "auth" ? "active" : ""}`}
              onClick={() => setActiveTab("auth")}
            >
              <Lock size={18} /> Authentication
            </button>
          </div>

          {/* Main Panel */}
          <div className="privacy-panel">
            {/* DATA STORAGE TAB */}
            {activeTab === "storage" && (
              <div className="panel-section">
                <div className="panel-title">
                  <Database size={20} /> Data Management
                </div>

                <div className="setting-card">
                  <div className="card-info">
                    <h4>Data Retention Policy</h4>
                    <p>Automatically delete chat history older than:</p>
                  </div>
                  <div className="range-slider-container">
                    <input
                      type="range"
                      min="30"
                      max="365"
                      step="30"
                      value={settings.retentionDays}
                      onChange={handleRetentionChange}
                      onMouseUp={handleRetentionCommit}
                      onTouchEnd={handleRetentionCommit}
                      className="range-slider"
                    />
                    <div className="range-labels">
                      <span>30 Days</span>
                      <span>6 Months</span>
                      <span>1 Year</span>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      color: "var(--primary)",
                    }}
                  >
                    {settings.retentionDays === 365
                      ? "1 Year"
                      : `${settings.retentionDays} Days`}
                  </div>
                </div>

                <div className="setting-card">
                  <div className="card-header">
                    <div className="card-info">
                      <h4>Export Your Data</h4>
                      <p>
                        Download a copy of your personal data and chat history
                        (JSON).
                      </p>
                    </div>
                    <button
                      className="action-btn btn-secondary"
                      onClick={handleExportData}
                    >
                      <Download size={18} /> Export Data
                    </button>
                  </div>
                </div>

                <div
                  className="setting-card"
                  style={{ borderColor: "rgba(239, 68, 68, 0.3)" }}
                >
                  <div className="card-header">
                    <div className="card-info">
                      <h4 style={{ color: "#ef4444" }}>Delete Account</h4>
                      <p>
                        Permanently remove your account and all associated data.
                      </p>
                    </div>
                    <button
                      className="action-btn btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                    >
                      <Trash2 size={18} /> Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AUTHENTICATION TAB */}
            {activeTab === "auth" && (
              <div className="panel-section">
                <div className="panel-title">
                  <Lock size={20} /> Security Settings
                </div>

                <div className="setting-card">
                  <div className="card-header">
                    <div className="card-info">
                      <h4>Change Password</h4>
                      <p>
                        Update your password regularly to keep your account
                        safe.
                      </p>
                    </div>
                    <button
                      className="action-btn btn-secondary"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <Key size={18} /> Update Password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Update Modal */}
      <PasswordUpdateModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default PrivacySettingsModal;
