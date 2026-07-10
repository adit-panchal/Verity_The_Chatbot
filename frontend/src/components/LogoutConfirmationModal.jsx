import { X, LogOut, AlertCircle } from "lucide-react";
import "../styles/LogoutConfirmationModal.css";

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm, userName }) => {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={onClose}>
      <div className="logout-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="logout-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="logout-modal-icon">
          <AlertCircle size={48} />
        </div>

        <h2 className="logout-modal-title">Log Out?</h2>

        <p className="logout-modal-message">
          {userName ? (
            <>
              Are you sure you want to log out, <strong>{userName}</strong>?
            </>
          ) : (
            "Are you sure you want to log out?"
          )}
        </p>

        <p className="logout-modal-warning">
          You'll need to sign in again to access your chats and continue
          conversations.
        </p>

        <div className="logout-modal-actions">
          <button className="logout-modal-btn cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="logout-modal-btn confirm-btn" onClick={onConfirm}>
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;
