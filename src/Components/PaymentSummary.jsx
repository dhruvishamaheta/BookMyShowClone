import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentSummary.css";

function PaymentSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSeats = [], totalPrice = 0 } = location.state || {};

  return (
    <div className="payment-summary">
      <h2 className="summary-title">Booking Summary</h2>

      <div className="summary-card">
        <p><strong>🎟️ Seats:</strong> {selectedSeats.join(", ") || "None"}</p>
        <p><strong>💰 Total Price:</strong> ₹{totalPrice}</p>
        <p><strong>📍 Theatre:</strong> Selected during showtime</p>
        <p><strong>⏰ Timing:</strong> Selected earlier</p>
      </div>

      <button
        className="proceed-btn"
        onClick={() => navigate("/payment", { state: { selectedSeats, totalPrice } })}
      >
        ✅ Proceed to Payment
      </button>
    </div>
  );
}

export default PaymentSummary;
