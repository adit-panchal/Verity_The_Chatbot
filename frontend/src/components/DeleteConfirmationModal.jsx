import { X, Trash2, AlertTriangle } from "lucide-react";
import "../styles/DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, chatTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="delete-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="delete-modal-icon">
          <AlertTriangle size={48} />
        </div>

        <h2 className="delete-modal-title">Delete Chat?</h2>

        <p className="delete-modal-message">
          Are you sure you want to delete{" "}
          <strong>"{chatTitle || "this chat"}"</strong>?
        </p>

        <p className="delete-modal-warning">
          This action cannot be undone. All messages in this conversation will
          be permanently deleted.
        </p>

        <div className="delete-modal-actions">
          <button className="delete-modal-btn cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-modal-btn confirm-btn" onClick={onConfirm}>
            <Trash2 size={18} />
            Delete Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
