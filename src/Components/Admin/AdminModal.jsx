import { useEffect } from "react";

function AdminModal({ title, icon, size = "md", children, actions, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="admin-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className={`admin-modal${size === "sm" ? " admin-modal-sm" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal-header">
          <div className="admin-modal-header-placeholder" aria-hidden="true" />
          <h3 className="admin-modal-title">
            <span>{title}</span>
          </h3>
          <button
            type="button"
            className="admin-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
        {actions && <div className="admin-modal-footer">{actions}</div>}
      </div>
    </div>
  );
}

export default AdminModal;
