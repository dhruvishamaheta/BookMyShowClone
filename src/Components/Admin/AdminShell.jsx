import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../utils/adminAuth";

function AdminShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login");
  };

  return (
    <div className="admin-shell">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Signature Admin Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="admin-brand-wrapper">
          <Link to="/admin" className="admin-brand">
            <div className="admin-brand-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
            <div className="admin-brand-text">
              <strong>BookMyShow</strong>
              <small>Admin Portal</small>
            </div>
          </Link>
          {mobileOpen && (
            <button
              type="button"
              className="admin-sidebar-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categorized Navigation in scrollable region */}
        <div className="admin-sidebar-nav-scroll">
          <nav className="admin-nav">
            <div className="admin-nav-section-title">Overview</div>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Dashboard</span>
              </div>
            </NavLink>

            <div className="admin-nav-section-title">Content Management</div>
            <NavLink
              to="/admin/movies"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
                <span>Movies</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/events"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Events</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/sports"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <span>Sports</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/activities"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <span>Activities</span>
              </div>
            </NavLink>

            <div className="admin-nav-section-title">Operations & Sales</div>
            <NavLink
              to="/admin/bookings"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <span>Bookings</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/offers"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>Offers & Discounts</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/giftcards"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
                <span>Gift Cards</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Users</span>
              </div>
            </NavLink>

            <div className="admin-nav-section-title">Support & Feedback</div>
            <NavLink
              to="/admin/reviews"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>Reviews & Ratings</span>
              </div>
            </NavLink>

            <NavLink
              to="/admin/contacts"
              className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}
            >
              <div className="admin-nav-link-content">
                <svg className="admin-nav-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>Contact Us</span>
              </div>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Footer Action Hub */}
        <div className="admin-sidebar-footer">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="admin-sidebar-btn admin-sidebar-btn-website"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>Live Website</span>
          </Link>

          <button
            type="button"
            className="admin-sidebar-btn admin-sidebar-btn-logout"
            onClick={handleLogout}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>

          <div className="admin-sidebar-version">
            <span className="admin-version-dot" />
            <span>v2.4.0 • Enterprise Edition</span>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="admin-content">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation drawer"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="admin-topbar-breadcrumb">
              <span className="breadcrumb-root">Admin</span>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">
                {location.pathname === "/admin"
                  ? "Dashboard"
                  : location.pathname.replace("/admin/", "").replace(/^\w/, (c) => c.toUpperCase())}
              </span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <Link to="/" target="_blank" rel="noreferrer" className="admin-topbar-link-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Live Site</span>
            </Link>

            <button
              type="button"
              className="admin-topbar-logout-btn"
              onClick={handleLogout}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Inner Page Body */}
        <main className="admin-main-body">{children}</main>

        {/* Admin Main Footer */}
        <footer className="admin-main-footer">
          <div className="admin-footer-left">
            <span className="admin-footer-copy">
              © {new Date().getFullYear()} <strong>BookMyShow Admin Portal</strong>. All rights reserved.
            </span>
            <span className="admin-footer-status">
              <span className="admin-footer-dot" /> System Active
            </span>
          </div>
          <div className="admin-footer-links">
            <Link to="/admin" className="admin-footer-link">Dashboard</Link>
            <Link to="/admin/movies" className="admin-footer-link">Movies</Link>
            <Link to="/admin/bookings" className="admin-footer-link">Bookings</Link>
            <Link to="/admin/users" className="admin-footer-link">Users</Link>
            <Link to="/" target="_blank" rel="noreferrer" className="admin-footer-link highlight">Live Site ↗</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminShell;
