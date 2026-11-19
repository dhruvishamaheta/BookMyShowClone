import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./EventPassBooking.css";

const cafeSections = [
  { name: "Window View", price: 350, rows: ["A", "B"], seatsPerRow: 4 },
  { name: "Center Table", price: 250, rows: ["C", "D"], seatsPerRow: 4 },
  { name: "Corner Booth", price: 180, rows: ["E", "F"], seatsPerRow: 4 },
];

const MAX_ATTENDEES = 10;

function isComedyEvent(event) {
  const eventInfo = `${event?.title || ""} ${event?.type || ""} ${event?.category || ""}`;
  return /comedy|stand[\s-]?up/i.test(eventInfo);
}

function getComedyPassTypes(event) {
  const regularPrice = Number(String(event?.price ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(regularPrice) || regularPrice <= 0) return [];

  const roundToTen = (price) => Math.round(price / 10) * 10;
  return [
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Limited-time price",
      price: Math.max(1, Math.min(regularPrice, roundToTen(regularPrice * 0.8))),
      attendeesPerPass: 1,
    },
    {
      id: "regular",
      name: "Regular",
      description: "Standard entry",
      price: Math.round(regularPrice),
      attendeesPerPass: 1,
    },
    {
      id: "couple",
      name: "Couple Pass",
      description: "Entry for 2",
      price: Math.max(1, roundToTen(regularPrice * 2 * 0.9)),
      attendeesPerPass: 2,
    },
  ];
}

function getComedyVenueDetails(event, slot) {
  const venue = String(event?.venue || slot?.venue || "").trim().replace(/^[•·\s]+/, "");
  const venueName = venue.split(",")[0].trim() || "Venue to be announced";
  const rawLocation = String(event?.location || event?.address || venue || slot?.venue || "").trim()
    .replace(/^[•·\s]+/, "");
  const location = rawLocation.toLowerCase().startsWith(venueName.toLowerCase())
    ? rawLocation.slice(venueName.length).replace(/^[,\s]+/, "") || "Location to be announced"
    : rawLocation || "Location to be announced";
  const slotVenue = String(slot?.venue || venueName).split(",")[0].trim();

  return {
    venueName: slotVenue.toLowerCase() === venueName.toLowerCase() ? venueName : slotVenue,
    location,
  };
}

function EventPassBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { event, slot, selectedDate } = location.state || {};
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passQuantities, setPassQuantities] = useState({});
  const comedyEvent = isComedyEvent(event);
  const passTypes = comedyEvent ? getComedyPassTypes(event) : [];

  useEffect(() => {
    setSelectedSeats([]);
    setPassQuantities({});
  }, [event?.id, slot?.time, selectedDate]);

  if (!event || !slot) {
    return <div className="event-pass-booking empty-state">No event data found</div>;
  }

  const selectedPasses = passTypes
    .filter((pass) => passQuantities[pass.id] > 0)
    .map((pass) => ({
      id: pass.id,
      name: pass.name,
      quantity: passQuantities[pass.id],
      attendeesPerPass: pass.attendeesPerPass,
      unitPrice: pass.price,
      totalPrice: pass.price * passQuantities[pass.id],
    }));
  const selectedAttendees = selectedPasses.reduce(
    (total, pass) => total + pass.quantity * pass.attendeesPerPass,
    0
  );
  const passTotal = selectedPasses.reduce((total, pass) => total + pass.totalPrice, 0);

  const changePassQuantity = (pass, change) => {
    setPassQuantities((current) => {
      const currentQuantity = current[pass.id] || 0;
      const nextQuantity = Math.max(0, currentQuantity + change);
      const nextAttendeeCount = selectedAttendees + change * pass.attendeesPerPass;

      if (change > 0 && nextAttendeeCount > MAX_ATTENDEES) return current;
      return { ...current, [pass.id]: nextQuantity };
    });
  };

  const handlePassBooking = () => {
    if (selectedPasses.length === 0) return;
    navigate("/payment", {
      state: {
        event,
        slot,
        selectedDate,
        selectedSeats: [],
        selectedPasses,
        totalPrice: passTotal,
      },
    });
  };

  if (comedyEvent) {
    const { venueName, location: locationText } = getComedyVenueDetails(event, slot);
    return (
      <div className="event-pass-booking">
        <div className="pass-card comedy-pass-card">
          <div className="comedy-pass-heading">
            <p className="section-kicker">Choose your tickets</p>
            <h2>{event.title}</h2>
            <div className="comedy-pass-event-info">
              <span>{selectedDate || event.date || "Date to be announced"}</span>
              <span>{slot.time}</span>
              <span>{venueName}</span>
            </div>
            {locationText !== "Location to be announced" && (
              <p className="comedy-pass-location">{locationText}</p>
            )}
          </div>

          {passTypes.length > 0 ? (
            <div className="comedy-pass-options">
              {passTypes.map((pass) => {
                const quantity = passQuantities[pass.id] || 0;
                const atLimit = selectedAttendees + pass.attendeesPerPass > MAX_ATTENDEES;
                return (
                  <article className="comedy-pass-option" key={pass.id}>
                    <div className="comedy-pass-description">
                      <h3>{pass.name}</h3>
                      <p>{pass.description}</p>
                      <strong className="comedy-pass-price">
                        ₹{pass.price.toLocaleString("en-IN")}
                        <span>{pass.attendeesPerPass === 2 ? " / 2 people" : " / person"}</span>
                      </strong>
                    </div>
                    <div className="comedy-pass-quantity">
                      <button
                        type="button"
                        aria-label={`Remove one ${pass.name}`}
                        onClick={() => changePassQuantity(pass, -1)}
                        disabled={quantity === 0}
                      >
                        −
                      </button>
                      <span aria-live="polite">{quantity}</span>
                      <button
                        type="button"
                        aria-label={`Add one ${pass.name}`}
                        onClick={() => changePassQuantity(pass, 1)}
                        disabled={atLimit}
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="comedy-pass-unavailable">Ticket pricing is not available for this event yet.</p>
          )}

          <div className="comedy-pass-summary">
            <div>
              <strong>{selectedAttendees} {selectedAttendees === 1 ? "attendee" : "attendees"}</strong>
              <p>
                {selectedPasses.length
                  ? selectedPasses.map((pass) => `${pass.name} × ${pass.quantity}`).join(" · ")
                  : "Select a pass to continue"}
              </p>
            </div>
            <div className="comedy-pass-total">
              <span>Total</span>
              <strong>₹{passTotal.toLocaleString("en-IN")}</strong>
            </div>
            <button
              type="button"
              className="book-btn"
              onClick={handlePassBooking}
              disabled={selectedPasses.length === 0}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const toggleSeat = (seatId, price) => {
    const exists = selectedSeats.some((seat) => seat.id === seatId);
    if (exists) {
      setSelectedSeats((prev) => prev.filter((seat) => seat.id !== seatId));
    } else {
      setSelectedSeats((prev) => [...prev, { id: seatId, price }]);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleBooking = () => {
    navigate("/payment", {
      state: {
        event,
        slot,
        selectedDate,
        selectedSeats: selectedSeats.map((seat) => seat.id),
        totalPrice,
      },
    });
  };

  return (
    <div className="event-pass-booking">
      <div className="pass-card">
        <p className="section-kicker">Cafe Seat Booking</p>
        <h2>{event.title}</h2>
        <p><strong>Venue:</strong> {slot.venue}</p>
        <p><strong>Location:</strong> {event.location || event.address || event.venue || slot.venue}</p>
        <p><strong>Time:</strong> {slot.time}</p>
        <a
          className="location-link"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || event.address || event.venue || slot.venue)}`}
          target="_blank"
          rel="noreferrer"
        >
          View venue on map
        </a>

        <div className="seat-grid cafe-seat-layout">
          {cafeSections.map((section) => (
            <div key={section.name} className="zone-card">
              <div className="zone-header">
                <strong>{section.name}</strong>
                <span>₹{section.price}</span>
              </div>
              {section.rows.map((row) => (
                <div key={row} className="seat-row">
                  <span className="row-label">{row}</span>
                  {Array.from({ length: section.seatsPerRow }, (_, i) => {
                    const seatId = `${section.name}-${row}${i + 1}`;
                    const isSelected = selectedSeats.some((seat) => seat.id === seatId);
                    return (
                      <button key={seatId} className={`seat ${isSelected ? "selected" : ""}`} onClick={() => toggleSeat(seatId, section.price)}>
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="summary-card">
          <p><strong>Selected:</strong> {selectedSeats.map((seat) => seat.id).join(", ") || "None"}</p>
          <p><strong>Total:</strong> ₹{totalPrice}</p>
          <button className="book-btn" onClick={handleBooking} disabled={selectedSeats.length === 0}>Book Seat</button>
        </div>
      </div>
    </div>
  );
}

export default EventPassBooking;
