import { Link } from "react-router-dom";
import "./StaticPages.css";

function About() {
  return (
    <div className="static-page-viewport">
      <div className="static-page-container">
        {/* Header */}
        <div className="static-page-header">
          <span className="static-kicker">About Us</span>
          <h1 className="static-page-title">About BookMyShow</h1>
          <p className="static-page-subtitle">
            Your one-stop destination for movies, live concerts, sports, and unforgettable entertainment experiences.
          </p>
        </div>

        {/* Card Content */}
        <div className="static-content-card">
          <h2>Who We Are</h2>
          <p>
            BookMyShow brings you seamless online ticketing for the latest blockbusters, major sports matches, live music concerts, standup comedy, and local activities across top cities in India.
          </p>

          {/* Quick Stats */}
          <div className="about-stats-banner">
            <div className="about-stat-box">
              <strong>500+</strong>
              <span>Cities Covered</span>
            </div>
            <div className="about-stat-box">
              <strong>5,000+</strong>
              <span>Screens & Venues</span>
            </div>
            <div className="about-stat-box">
              <strong>100%</strong>
              <span>Verified Bookings</span>
            </div>
          </div>

          <h2>What You Can Explore</h2>
          <div className="about-features-grid">
            <div className="about-feature-item">
              <span className="about-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#F84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
              </span>
              <h4>Movies</h4>
              <p>Showtimes, trailers, language filters, and interactive seat selection across all major cinemas.</p>
            </div>

            <div className="about-feature-item">
              <span className="about-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </span>
              <h4>Events & Concerts</h4>
              <p>Live music gigs, stand-up comedy shows, theatre plays, and cultural festivals.</p>
            </div>

            <div className="about-feature-item">
              <span className="about-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                  <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
                  <path d="M4 22h16" />
                  <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
                </svg>
              </span>
              <h4>Sports</h4>
              <p>Cricket matches, football leagues, marathons, and stadium tournament tickets.</p>
            </div>

            <div className="about-feature-item">
              <span className="about-feature-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </span>
              <h4>Activities</h4>
              <p>Theme parks, gaming zones, outdoor adventures, and family experiences.</p>
            </div>
          </div>

          <h2>Why Book With Us?</h2>
          <ul>
            <li><strong>Instant Digital Tickets:</strong> Get QR tickets instantly upon booking with real-time seat confirmation.</li>
            <li><strong>Secure Payments:</strong> Safe transactions via UPI, Credit/Debit Cards, and Net Banking.</li>
            <li><strong>City-Wise Entertainment:</strong> Easily switch cities to explore local events and cinemas near you.</li>
            <li><strong>Easy Management:</strong> View, manage, and track all your bookings in your personal profile.</li>
          </ul>

          <div className="static-cta-box">
            <h3>Looking for entertainment?</h3>
            <p>Discover trending movies and exciting events happening around you.</p>
            <Link to="/movies" className="static-cta-btn">
              Browse Movies & Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
