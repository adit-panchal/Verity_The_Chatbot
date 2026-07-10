import React, { useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import "../styles/UserInfoModal.css";

const UserInfoModal = ({ isOpen, onClose }) => {
  const { user, activePlan } = useAuth();
  const { t, language } = useLanguage();
  const modalRef = useRef(null);

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

  if (!isOpen || !user) return null;

  return (
    <div className="user-info-overlay">
      <div className="user-info-modal" ref={modalRef}>
        <div className="user-info-header">
          <div className="user-cover"></div>
          <div className="user-avatar-large">
            {user?.name
              ? user.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
              : "U"}
          </div>
        </div>

        <div className="user-info-body">
          <div className="user-details-main">
            <h2 className="user-fullname">{user.name}</h2>
            <div className="user-email-display">{user.email}</div>
            <div className="user-badges">
              <span className={`badge ${activePlan ? "pro" : ""}`}>
                {activePlan ? activePlan.name : t("freePlan")}
              </span>
              <span className="badge pro">Early Adopter</span>
            </div>
          </div>

          <div className="user-stats-grid">
            <div className="stat-item">
              <span className="stat-value">
                {activePlan ? activePlan.name : t("free")}
              </span>
              <span className="stat-label">{t("currentPlan")}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{language.toUpperCase()}</span>
              <span className="stat-label">{t("language")}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{t("active")}</span>
              <span className="stat-label">{t("status")}</span>
            </div>
          </div>
        </div>

        <div className="user-info-footer">
          <button className="close-user-btn" onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
