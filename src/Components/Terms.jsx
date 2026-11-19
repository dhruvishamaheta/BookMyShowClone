import { Link } from "react-router-dom";
import "./StaticPages.css";

function Terms() {
  return (
    <div className="static-page-viewport">
      <div className="static-page-container">
        {/* Header */}
        <div className="static-page-header">
          <span className="static-kicker">Terms of Service</span>
          <h1 className="static-page-title">Terms & Conditions</h1>
          <p className="static-page-subtitle">
            Essential terms governing your ticket bookings and use of the BookMyShow platform.
          </p>
          <span className="static-last-updated">Last Updated: September 2026</span>
        </div>

        {/* Card Content */}
        <div className="static-content-card">
          <h2>1. Account Registration</h2>
          <p>
            Users must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and all activities under your account.
          </p>

          <h2>2. Ticket Booking & Confirmation</h2>
          <ul>
            <li><strong>Instant Confirmation:</strong> Bookings are confirmed upon successful payment. A digital QR ticket is immediately generated and saved to your account.</li>
            <li><strong>Seat Allocation:</strong> Seats selected during the booking flow are locked temporarily and confirmed once payment is complete.</li>
            <li><strong>Entry Verification:</strong> You must present your digital QR ticket or confirmation SMS/Email at the cinema or event entrance for admission.</li>
          </ul>

          <h2>3. Pricing & Convenience Fees</h2>
          <p>
            Ticket prices are set directly by cinema chains and event organizers. Any applicable taxes (GST) and booking convenience fees are clearly displayed before payment confirmation.
          </p>

          <h2>4. Cancellation & Refund Policy</h2>
          <ul>
            <li><strong>Cinema Bookings:</strong> Cancellation terms depend on the specific cinema policy and showtime cutoff window.</li>
            <li><strong>Live Events & Sports:</strong> Tickets for live concerts, festivals, and sporting events are generally non-refundable unless the event is officially cancelled by the organizers.</li>
            <li><strong>Cancelled Shows:</strong> If a movie show or event is cancelled by the venue or organizer, full refunds will be processed back to the original payment method.</li>
          </ul>

          <h2>5. Venue Rules & Conduct</h2>
          <p>
            Entry to cinemas and event venues is subject to the venue's rules, age restrictions (e.g. 'A' rated movies), and safety guidelines. The venue management reserves the right of admission.
          </p>

          <h2>6. Platform Usage</h2>
          <p>
            Unauthorized bulk ticket purchasing, automated scraping, or resale of tickets above face value is strictly prohibited and will lead to immediate account suspension.
          </p>

          <div className="static-contact-callout">
            <p>
              Need help with your booking or have questions about these terms? Visit our <Link to="/contact">Contact Page</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;
