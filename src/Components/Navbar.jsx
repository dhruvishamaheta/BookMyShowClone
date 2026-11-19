import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import CitySelectionModal from "./CitySelectionModal";
import SearchBar from "./SearchBar";
import ProfileUpdateModal from "./ProfileUpdateModal";
import "./Navbar.css";
import logo from "../assets/logo.png";
import {
  clearCurrentUser,
  getCurrentUser,
  getSelectedCity,
  saveSelectedCity,
  setCurrentUser,
} from "../utils/userStorage";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(() => getSelectedCity());
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    setCurrentUserState(getCurrentUser());
    setSelectedCity(getSelectedCity());
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Listen to userUpdated and storage events for instant profile photo and user sync
  useEffect(() => {
    const handleUserUpdate = (e) => {
      setCurrentUserState(e?.detail || getCurrentUser());
    };
    window.addEventListener("userUpdated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, []);

  // Handle click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    clearCurrentUser();
    setCurrentUserState(null);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const getUserDisplayName = () => {
    if (!currentUser) return "User";
    return (
      currentUser.name ||
      currentUser.username ||
      currentUser.email?.split("@")[0] ||
      "User"
    );
  };

  const getUserInitial = () => {
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase() || "U";
  };

  const getUserProfilePhoto = () => {
    return currentUser?.profileImage || currentUser?.avatar || "";
  };

  // Helper to determine exact active tab for navigation
  const isTabActive = (tab) => {
    const path = location.pathname;
    switch (tab) {
      case "movies":
        return (
          path === "/movies" ||
          path.startsWith("/movies/") ||
          path.startsWith("/movie/") ||
          path.startsWith("/showtimes/") ||
          path.startsWith("/seats/")
        );
      case "events":
        return path === "/events" || path.startsWith("/events/");
      case "sports":
        return path === "/sports" || path.startsWith("/sports/");
      case "activities":
        return path === "/activity" || path.startsWith("/activity/");
      case "offers":
        return path === "/offers";
      case "giftcards":
        return path === "/giftcards" || path === "/gift-cards";
      case "contact":
        return path === "/contact";
      default:
        return false;
    }
  };

  return (
    <>
      <header className="navbar-wrapper">
        {/* Top Navbar Header (Pure White Background with Glassmorphism) */}
        <div className="navbar-top">
          <div className="navbar-top-container">
            {/* Left: Brand Logo & Search Bar */}
            <div className="navbar-left">
              <Link to="/" className="brand" aria-label="BookMyShow Home">
                <img src={logo} alt="BookMyShow Logo" className="logo-img" />
              </Link>

              <div className="navbar-search-container">
                <SearchBar />
              </div>
            </div>

            {/* Right: City Selector & Auth Actions & Mobile Toggle */}
            <div className="navbar-right">
              {/* City Dropdown: Location Icon + City Name + Chevron */}
              <button
                type="button"
                className="city-select-btn"
                onClick={() => setCityModalOpen(true)}
                aria-label={`Select city. Currently selected: ${selectedCity || "Select City"}`}
                title="Select City"
              >
                <svg
                  className="city-location-pin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="city-name-text">{selectedCity || "Select City"}</span>
                <svg
                  className="city-dropdown-chevron"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </button>

              {/* Auth Actions / User Profile */}
              <div className="navbar-actions">
                {currentUser ? (
                  <div className="user-profile-menu-container" ref={profileRef}>
                    <button
                      type="button"
                      className="user-profile-chip"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      aria-expanded={profileDropdownOpen}
                      aria-haspopup="true"
                    >
                      <div className="user-avatar-circle">
                        {getUserProfilePhoto() ? (
                          <img
                            src={getUserProfilePhoto()}
                            alt={getUserDisplayName()}
                            className="user-avatar-img"
                            onError={(e) => {
                              e.target.style.display = "none";
                              const fallback = e.target.parentElement?.querySelector(".default-avatar-fallback");
                              if (fallback) fallback.style.display = "block";
                            }}
                          />
                        ) : null}
                        <div
                          className="default-avatar-fallback"
                          style={{ display: getUserProfilePhoto() ? "none" : "block" }}
                        >
                          <svg viewBox="0 0 36 36" fill="none" className="default-avatar-svg" width="34" height="34">
                            <circle cx="18" cy="18" r="18" fill="#F0F4F8" />
                            {/* Hair */}
                            <path d="M11 18C10.5 13 12.5 9 18 9C23.5 9 25.5 13 25 18C24 16 22 14 18 14C14 14 12 16 11 18Z" fill="#374151" />
                            {/* Head */}
                            <ellipse cx="18" cy="17" rx="5.5" ry="6" fill="#FBBF24" />
                            {/* Hair front */}
                            <path d="M12.5 14C14 11.5 16 10.5 18 10.5C20.5 10.5 22.5 11.5 23.5 14C21.5 12 19 12 18 13C16.5 14.5 14.5 13 12.5 14Z" fill="#374151" />
                            {/* Suit / Clothes */}
                            <path d="M8 34C8 26.5 12.5 23.5 18 23.5C23.5 23.5 28 26.5 28 34" fill="#1E40AF" />
                            {/* White shirt inner */}
                            <path d="M16 23.5L18 28L20 23.5" fill="#FFFFFF" />
                          </svg>
                        </div>
                      </div>
                      <span className="user-profile-greeting">
                        Hi, {getUserDisplayName()}
                      </span>
                    </button>

                    {/* Little popup menu under user greeting / near bottom navbar */}
                    {!profileDropdownOpen && <ProfileUpdateModal />}

                    {/* Profile Dropdown Menu */}
                    {profileDropdownOpen && (
                      <div className="profile-dropdown-menu">
                        <div className="profile-dropdown-header">
                          <div className="profile-dropdown-avatar">
                            {getUserProfilePhoto() ? (
                              <img
                                src={getUserProfilePhoto()}
                                alt={getUserDisplayName()}
                                className="user-avatar-img"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const fallback = e.target.parentElement?.querySelector(".avatar-initial-fallback");
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <span
                              className="avatar-initial-fallback"
                              style={{ display: getUserProfilePhoto() ? "none" : "flex" }}
                            >
                              {getUserInitial()}
                            </span>
                          </div>
                          <div className="profile-dropdown-info">
                            <span className="profile-dropdown-name">
                              {getUserDisplayName()}
                            </span>
                            <span className="profile-dropdown-email">
                              {currentUser.email || currentUser.mobile || "BookMyShow Member"}
                            </span>
                          </div>
                        </div>

                        <div className="profile-dropdown-divider" />

                        <ul className="profile-dropdown-list">
                          <li>
                            <button
                              type="button"
                              className="profile-dropdown-item"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                navigate("/profile?tab=profile", { state: { tab: "profile" } });
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              <span>My Profile</span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className="profile-dropdown-item"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                navigate("/profile?tab=history", { state: { tab: "history" } });
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <line x1="2" y1="10" x2="22" y2="10" />
                              </svg>
                              <span>Your Bookings</span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className="profile-dropdown-item"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                navigate("/giftcards");
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 12 20 22 4 22 4 12" />
                                <rect x="2" y="7" width="20" height="5" />
                                <line x1="12" y1="22" x2="12" y2="7" />
                                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                              </svg>
                              <span>My Gift Cards</span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              className="profile-dropdown-item"
                              onClick={() => {
                                setProfileDropdownOpen(false);
                                navigate("/contact");
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              <span>Help & Support</span>
                            </button>
                          </li>
                        </ul>

                        <div className="profile-dropdown-divider" />

                        <div className="profile-dropdown-footer">
                          <button
                            type="button"
                            className="profile-dropdown-logout-btn"
                            onClick={handleLogout}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                              <polyline points="16 17 21 12 16 7" />
                              <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="auth-buttons-group">
                    <button
                      type="button"
                      className="signin-btn nav-btn-primary"
                      onClick={() => navigate("/login")}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      className="signin-btn signin-btn-secondary"
                      onClick={() => navigate("/signup")}
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                className={`mobile-menu-toggle ${mobileMenuOpen ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navbar (Sub-navigation Bar - Sleek High-Visibility Dark Slate) */}
        <nav className="navbar-bottom" aria-label="Main Navigation">
          <div className="navbar-bottom-container">
            {/* Left: Category Links */}
            <ul className="nav-links main-nav-links">
              <li>
                <Link
                  to="/movies"
                  className={`nav-link-item ${isTabActive("movies") ? "active" : ""}`}
                >
                  Movies
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className={`nav-link-item ${isTabActive("events") ? "active" : ""}`}
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  to="/sports"
                  className={`nav-link-item ${isTabActive("sports") ? "active" : ""}`}
                >
                  Sports
                </Link>
              </li>
              <li>
                <Link
                  to="/activity"
                  className={`nav-link-item ${isTabActive("activities") ? "active" : ""}`}
                >
                  Activities
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className={`nav-link-item ${isTabActive("contact") ? "active" : ""}`}
                >
                  Contact
                </Link>
              </li>
            </ul>

            {/* Right: Secondary Links (Offers & Gift Cards on the Right Side) */}
            <ul className="nav-links secondary-nav-links">
              <li>
                <Link
                  to="/offers"
                  className={`nav-link-item ${isTabActive("offers") ? "active" : ""}`}
                >
                  <span>Offers</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/giftcards"
                  className={`nav-link-item ${isTabActive("giftcards") ? "active" : ""}`}
                >
                  <span>Gift Cards</span>
                  <span className="sub-link-badge" style={{ marginLeft: "6px" }}>NEW</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                <img src={logo} alt="BookMyShow" className="mobile-logo-img" />
              </div>
              <button
                type="button"
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Mobile User Header */}
            <div className="mobile-drawer-user-section">
              {currentUser ? (
                <div className="mobile-user-card">
                  <div className="user-avatar-circle large">
                    {getUserProfilePhoto() ? (
                      <img
                        src={getUserProfilePhoto()}
                        alt={getUserDisplayName()}
                        className="user-avatar-img"
                        onError={(e) => {
                          e.target.style.display = "none";
                          const fallback = e.target.parentElement?.querySelector(".avatar-initial-fallback");
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      className="avatar-initial-fallback"
                      style={{ display: getUserProfilePhoto() ? "none" : "flex" }}
                    >
                      {getUserInitial()}
                    </span>
                  </div>
                  <div className="mobile-user-info">
                    <span className="mobile-user-name">
                      Hi, {getUserDisplayName()}
                    </span>
                    <span className="mobile-user-email">
                      {currentUser.email || currentUser.mobile || "BookMyShow Member"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mobile-auth-prompt">
                  <p className="mobile-auth-text">Unlock special offers & seamless bookings!</p>
                  <div className="mobile-auth-actions">
                    <button
                      type="button"
                      className="signin-btn nav-btn-primary full-width"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/login");
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      className="signin-btn signin-btn-secondary full-width"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/signup");
                      }}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile City Selector */}
            <div className="mobile-drawer-city-picker">
              <button
                type="button"
                className="mobile-city-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCityModalOpen(true);
                }}
              >
                <div className="mobile-city-left">
                  <svg
                    className="city-location-pin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <span className="mobile-city-label">Selected City</span>
                    <strong className="mobile-city-value">{selectedCity || "Select City"}</strong>
                  </div>
                </div>
                <span className="mobile-city-change-text">Change</span>
              </button>
            </div>

            {/* Mobile Navigation Categories */}
            <div className="mobile-drawer-links-section">
              <span className="mobile-links-title">Explore Categories</span>
              <ul className="mobile-drawer-links-list">
                <li>
                  <Link
                    to="/movies"
                    className={`mobile-drawer-link ${isTabActive("movies") ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" />
                      <line x1="7" y1="2" x2="7" y2="22" />
                      <line x1="17" y1="2" x2="17" y2="22" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                    </svg>
                    <span>Movies</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/events"
                    className={`mobile-drawer-link ${isTabActive("events") ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>Events</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sports"
                    className={`mobile-drawer-link ${isTabActive("sports") ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
                      <path d="M4 22h16" />
                      <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
                    </svg>
                    <span>Sports</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/activity"
                    className={`mobile-drawer-link ${isTabActive("activities") ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                    <span>Activities</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/offers"
                    className={`mobile-drawer-link ${isTabActive("offers") ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    <span>Offers & Deals</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/giftcards"
                    className={`mobile-drawer-link ${isTabActive("giftcards") ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 12 20 22 4 22 4 12" />
                      <rect x="2" y="7" width="20" height="5" />
                      <line x1="12" y1="22" x2="12" y2="7" />
                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                    </svg>
                    <span>Gift Cards</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className={`mobile-drawer-link ${isTabActive("contact") ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Contact Us</span>
                  </Link>
                </li>
              </ul>

              {currentUser && (
                <>
                  <span className="mobile-links-title">My Account</span>
                  <ul className="mobile-drawer-links-list">
                    <li>
                      <button
                        type="button"
                        className="mobile-drawer-link"
                        style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/profile?tab=profile", { state: { tab: "profile" } });
                        }}
                      >
                        <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>My Profile</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="mobile-drawer-link"
                        style={{ background: "transparent", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/profile?tab=history", { state: { tab: "history" } });
                        }}
                      >
                        <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <span>Your Bookings</span>
                      </button>
                    </li>
                  </ul>
                </>
              )}

              <span className="mobile-links-title">More</span>
              <ul className="mobile-drawer-links-list">
                <li>
                  <Link
                    to="/about"
                    className="mobile-drawer-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>About Us</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="mobile-drawer-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="mobile-drawer-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg className="mobile-link-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>Terms of Service</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Mobile Footer with Logout if logged in */}
            {currentUser && (
              <div className="mobile-drawer-footer">
                <button
                  type="button"
                  className="mobile-logout-btn"
                  onClick={handleLogout}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* City Selection Modal */}
      {cityModalOpen && (
        <CitySelectionModal
          currentCity={selectedCity}
          onSelect={(city) => {
            setSelectedCity(city);
            saveSelectedCity(city);
            if (currentUser) {
              const updatedUser = { ...currentUser, city };
              setCurrentUser(updatedUser);
              setCurrentUserState(updatedUser);
            }
            setCityModalOpen(false);
          }}
          onClose={() => setCityModalOpen(false)}
        />
      )}
    </>
  );
}

export default Navbar;
