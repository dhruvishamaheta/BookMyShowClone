import { Link } from "react-router-dom";
import "./StaticPages.css";

function PrivacyPolicy() {
  return (
    <div className="static-page-viewport">
      <div className="static-page-container">
        {/* Header */}
        <div className="static-page-header">
          <span className="static-kicker">Privacy & Trust</span>
          <h1 className="static-page-title">Privacy Policy</h1>
          <p className="static-page-subtitle">
            How we handle and safeguard your personal information when you use BookMyShow.
          </p>
          <span className="static-last-updated">Last Updated: September 2026</span>
        </div>

        {/* Card Content */}
        <div className="static-content-card">
          <h2>1. Information We Collect</h2>
          <p>We only collect information necessary to provide and improve your ticketing experience:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, phone number, and city preferences when you sign up.</li>
            <li><strong>Booking Details:</strong> Selected movie/event, showtime, seat selection, and transaction history.</li>
            <li><strong>Device & Usage:</strong> Basic device type, browser information, and selected city to deliver relevant showtimes.</li>
          </ul>

          <h2>2. How We Use Your Data</h2>
          <p>Your information is used strictly to:</p>
          <ul>
            <li>Generate instant electronic booking confirmations and QR entry tickets.</li>
            <li>Process payments securely through verified payment gateways.</li>
            <li>Allow you to access your previous bookings in your Profile.</li>
            <li>Provide customer support regarding your bookings and cancellations.</li>
          </ul>

          <h2>3. Data Protection & Security</h2>
          <p>
            We implement industry-standard encryption protocols to protect your personal data. We do not store sensitive payment credentials such as card CVVs or bank passwords.
          </p>

          <h2>4. Information Sharing</h2>
          <p>
            We never sell your data to third parties. Information is only shared with authorized cinema operators and event organizers to validate your entry at the venue gate.
          </p>

          <h2>5. Your Choices & Account Control</h2>
          <p>
            You can review or update your personal details and city preferences anytime from your <Link to="/profile" style={{ color: "rgb(235, 78, 98)", fontWeight: "600" }}>Profile Settings</Link>.
          </p>

          <div className="static-contact-callout">
            <p>
              Have questions about your privacy? Reach out to us via <Link to="/contact">Contact Us</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
