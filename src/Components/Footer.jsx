import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Footer.css";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="unique-footer" aria-label="BookMyShow Footer">
      <div className="unique-footer-container">
        {/* Quick Cinema Experience Dock */}
        <div className="footer-experience-dock">
          <div className="dock-live-status">
            <span className="live-status-dot" />
            <span className="live-status-text">
              Live in Theatres: <strong>2D & 3D Movies</strong> • Concerts • Live Matches
            </span>
          </div>

          <div className="dock-quick-links">
            <Link to="/movies" className="dock-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
              <span>Movies</span>
            </Link>

            <Link to="/events" className="dock-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Events</span>
            </Link>

            <Link to="/sports" className="dock-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              <span>Sports</span>
            </Link>

            <Link to="/activity" className="dock-item">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>Activities</span>
            </Link>

            <Link to="/profile" className="dock-item dock-item-highlight">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <span>My Tickets</span>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="unique-footer-main">
          {/* Brand & Cinema Badge */}
          <div className="unique-footer-brand-section">
            <Link to="/" className="unique-footer-logo-link">
              <img src={logo} alt="BookMyShow" className="unique-footer-logo" />
            </Link>
            <p className="unique-footer-tagline">
              India's premier ticketing portal for movies, concerts, comedy specials, and sports showdowns.
            </p>
            <div className="cinema-experience-badge">
              <span className="badge-3d">3D & 2D</span>
              <span className="badge-text">Instant E-Tickets • Seat Selection</span>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="unique-footer-links-grid">
            <div className="unique-link-group">
              <span className="unique-group-title">Entertainment</span>
              <Link to="/movies">3D & 2D Movies</Link>
              <Link to="/events">Concerts & Comedy</Link>
              <Link to="/sports">Cricket & Matches</Link>
              <Link to="/activity">Adventure & Parks</Link>
            </div>

            <div className="unique-link-group">
              <span className="unique-group-title">Help & Trust</span>
              <Link to="/contact">24/7 Help Desk</Link>
              <Link to="/profile">My Account</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>

          {/* Right Floating Actions */}
          <div className="unique-footer-actions">
            <div className="ssl-security-tag">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>100% Safe & Verified</span>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="scroll-top-btn"
              aria-label="Back to Top"
              title="Back to Top"
            >
              <span>Top</span>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="unique-footer-bottom">
          <div className="unique-bottom-left">
            <p>© {new Date().getFullYear()} BookMyShow Project. All rights reserved.</p>
          </div>

          <div className="unique-social-links">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-pill">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="social-pill">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter X" className="social-pill">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="social-pill">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
