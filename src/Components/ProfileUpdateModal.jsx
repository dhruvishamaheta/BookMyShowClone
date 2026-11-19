import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/userStorage";
import "./ProfileUpdateModal.css";

function ProfileUpdateModal({ isOpen: propIsOpen, onClose: propOnClose, user: propUser }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => propUser || getCurrentUser());
  const popupRef = useRef(null);

  useEffect(() => {
    if (typeof propIsOpen === "boolean") {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  // Check on mount and listen to triggers
  useEffect(() => {
    const checkTrigger = () => {
      const user = getCurrentUser();
      setCurrentUser(user);

      const pendingTrigger = sessionStorage.getItem("bms_show_profile_popup");
      if (pendingTrigger === "true" && user) {
        setIsOpen(true);
      }
    };

    checkTrigger();

    const handleCustomTrigger = (e) => {
      if (e?.detail) {
        setCurrentUser(e.detail);
      } else {
        setCurrentUser(getCurrentUser());
      }
      setIsOpen(true);
    };

    window.addEventListener("triggerProfileUpdateModal", handleCustomTrigger);
    window.addEventListener("userUpdated", checkTrigger);

    return () => {
      window.removeEventListener("triggerProfileUpdateModal", handleCustomTrigger);
      window.removeEventListener("userUpdated", checkTrigger);
    };
  }, []);

  if (!isOpen || !currentUser) return null;

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    sessionStorage.removeItem("bms_show_profile_popup");
    setIsOpen(false);
    if (propOnClose) propOnClose();
  };

  const handleOkRedirect = (e) => {
    if (e) e.stopPropagation();
    sessionStorage.removeItem("bms_show_profile_popup");
    setIsOpen(false);
    if (propOnClose) propOnClose();
    // Redirect to profile page with Personal Details tab and auto-enable edit mode
    navigate("/profile?tab=profile", { state: { tab: "profile", edit: true } });
  };

  const displayName = currentUser.name || currentUser.username || "User";
  const userInitial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <div
      ref={popupRef}
      className="profile-little-popup-card"
      role="dialog"
      aria-label="Update your profile prompt"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top arrow pointer pointing to the user profile in navbar */}
      <div className="little-popup-arrow"></div>

      {/* Close button */}
      <button
        type="button"
        className="little-popup-close-btn"
        onClick={handleClose}
        aria-label="Dismiss notification"
        title="Close"
      >
        ✕
      </button>

      <div className="little-popup-main-content">
        {/* Left icon / avatar badge */}
        <div className="little-popup-avatar">
          <span className="little-popup-initial">{userInitial}</span>
          <span className="little-popup-dot"></span>
        </div>

        {/* Text info */}
        <div className="little-popup-text-block">
          <h4 className="little-popup-heading">Update your profile</h4>
          <p className="little-popup-subtext">
            Hi <strong>{displayName}</strong>, update your name & details to complete your account.
          </p>
        </div>

        {/* OK Action Button */}
        <div className="little-popup-actions">
          <button
            type="button"
            className="little-popup-ok-btn"
            onClick={handleOkRedirect}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileUpdateModal;
