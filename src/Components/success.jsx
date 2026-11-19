import { useLocation, useNavigate } from "react-router-dom";
import "./Success.css";

function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    movie,
    event,
    slot,
    selectedDate,
    sport,
    activity,
    selectedSeats,
    selectedPasses = [],
    totalPrice,
    grandTotal,
    discountAmount = 0,
    appliedOffer = null,
    ticket,
  } = location.state || {};
  const bookedPasses = selectedPasses.length > 0 ? selectedPasses : ticket?.passes || [];
  const qrValue = ticket?.id || ticket?.qr || "booking-ticket";
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrValue)}`;

  return (
    <div className="success-page">
      <div className="success-card">
        <p className="section-kicker">Booking Confirmed</p>
        <h2>Enjoy your show!</h2>
        <p className="success-message">Your booking is confirmed. Please arrive 15 minutes early.</p>

        <div className="success-ticket-layout">
          <div className="success-info-panel">
            {movie && (
              <div className="detail-card">
                {movie.poster && <img className="success-poster" src={movie.poster} alt={movie.title} />}
                <p><strong>Movie:</strong> {movie.title}</p>
                <p><strong>Theatre:</strong> {movie.theatre}</p>
                <p><strong>City:</strong> {movie.city}</p>
                <p><strong>Date:</strong> {movie.selectedDate}</p>
                <p><strong>Showtime:</strong> {movie.showtime}</p>
                <p><strong>Format:</strong> {movie.language}, {movie.format}</p>
              </div>
            )}

            {event && (
              <div className="detail-card">
                <p><strong>Event:</strong> {event.title}</p>
                <p><strong>Date:</strong> {selectedDate || event.date || "Date to be announced"}</p>
                <p><strong>Venue:</strong> {slot?.venue || event.venue}</p>
                <p><strong>Time:</strong> {slot?.time}</p>
                {(event.location || event.address) && (
                  <p><strong>Location:</strong> {event.location || event.address}</p>
                )}
              </div>
            )}

            {sport && (
              <div className="detail-card">
                <p><strong>Sport:</strong> {sport.title}</p>
                <p><strong>Venue:</strong> {sport.venue}</p>
                <p><strong>Date:</strong> {selectedDate || sport.date}</p>
              </div>
            )}

            {activity && (
              <div className="detail-card">
                <p><strong>Activity:</strong> {activity.title}</p>
                <p><strong>Location:</strong> {activity.location}</p>
                <p><strong>Time:</strong> {activity.time}</p>
              </div>
            )}

            <div className="detail-card">
              {bookedPasses.length > 0 ? (
                <div>
                  <strong>Passes:</strong>
                  {bookedPasses.map((pass) => (
                    <p key={pass.id}>
                      {pass.name} × {pass.quantity} · ₹{Number(pass.totalPrice || 0).toLocaleString("en-IN")}
                    </p>
                  ))}
                </div>
              ) : (
                <p><strong>Seats:</strong> {selectedSeats?.join(", ") || "General Admission"}</p>
              )}
              <p><strong>Base Total:</strong> ₹{totalPrice}</p>
              {(ticket?.discount > 0 || discountAmount > 0) && (
                <p style={{ color: "#059669", fontWeight: 700 }}>
                  <strong>🎁 Offer Discount ({ticket?.couponCode || appliedOffer?.code}):</strong> - ₹{(ticket?.discount || discountAmount).toFixed(2)}
                </p>
              )}
              <p><strong>Amount Paid:</strong> ₹{Number(grandTotal || ticket?.amount || 0).toFixed(2)}</p>
              <p><strong>Payment Status:</strong> <span style={{ color: "#059669" }}>Paid</span></p>
              <p><strong>Payment Method:</strong> {ticket?.method || "Razorpay"}</p>
              {ticket?.paymentId && <p><strong>Razorpay Payment ID:</strong> {ticket.paymentId}</p>}
            </div>
          </div>

          <div className="ticket-box">
            <p className="ticket-label">DIGITAL ENTRY PASS</p>
            <h3>Scan this QR at the venue</h3>
            <img className="ticket-qr-image" src={qrImageUrl} alt={`QR ticket for ${ticket?.id || "booking"}`} />
            <p><strong>Booking ID:</strong> {ticket?.id}</p>
            <p className="ticket-code">{ticket?.qr}</p>
          </div>
        </div>

        <div className="success-action-buttons">
          <button
            className="view-bookings-btn"
            onClick={() => navigate("/profile?tab=history", { state: { tab: "history" } })}
          >
            View Booking History & Rate Movie
          </button>
          <button className="home-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Success;
