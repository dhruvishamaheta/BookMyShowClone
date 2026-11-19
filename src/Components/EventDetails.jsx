import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStoredEvents, initializeAdminData, normalizeEvents } from "../utils/adminData";
import { getEventsApi } from "../utils/api";
import {
  formatDisplayDate,
  generateValidBookingDates,
  getEventBookingEndDate,
  isItemActive,
  resolveItemDates,
} from "../utils/dateUtils";
import ReviewSection from "./ReviewSection";
import "./EventDetails.css";

function findEvent(events, targetId) {
  if (!events || !targetId) return null;
  const decoded = decodeURIComponent(targetId).toLowerCase();
  return (
    events.find(
      (e) =>
        e.id === targetId ||
        e._id === targetId ||
        String(e.id || "").toLowerCase() === decoded ||
        String(e._id || "").toLowerCase() === decoded ||
        String(e.title || "").toLowerCase() === decoded ||
        String(e.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-") === decoded
    ) || null
  );
}

function isConcertEvent(event) {
  const category = String(event?.category || "").toLowerCase();
  const type = String(event?.type || "").toLowerCase();
  return category === "auditorium" || category === "outdoor" || type.includes("concert") || type.includes("music");
}

function isCafeEvent(event) {
  return String(event?.category || "").toLowerCase() === "cafe";
}

function isComedyEvent(event) {
  const eventInfo = `${event?.title || ""} ${event?.type || ""} ${event?.category || ""}`;
  return /comedy|stand[\s-]?up/i.test(eventInfo);
}

function getVenueName(venue) {
  return String(venue || "")
    .split(",")[0]
    .trim()
    .replace(/^[•·\s]+/, "") || "Venue to be announced";
}

function getShowtimeVenueName(slotVenue, eventVenueName) {
  const venueName = getVenueName(slotVenue);
  return venueName.toLowerCase() === eventVenueName.toLowerCase() ? eventVenueName : venueName;
}

function getVenueDetails(event) {
  const venue = String(event?.venue || "").trim().replace(/^[•·\s]+/, "");
  const explicitLocation = String(event?.location || event?.address || event?.city || "").trim();
  const venueParts = venue.split(",").map((part) => part.trim()).filter(Boolean);
  const venueName = getVenueName(venue);
  let location = explicitLocation;

  if (location.toLowerCase().startsWith(venueName.toLowerCase())) {
    location = location.slice(venueName.length).replace(/^[,\s]+/, "");
  }
  if (!location) {
    location = venueParts.slice(1).join(", ") || "Location to be announced";
  }

  return { venueName, location };
}

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(() => findEvent(getStoredEvents(), id));
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setSelectedDateIndex(0);

    async function loadEvent() {
      try {
        const apiEvents = await getEventsApi();
        const eventsSource = Array.isArray(apiEvents)
          ? apiEvents
          : apiEvents?.data && Array.isArray(apiEvents.data)
          ? apiEvents.data
          : [];

        if (eventsSource.length > 0) {
          const match = findEvent(normalizeEvents(eventsSource), id);
          if (isMounted && match) {
            setEvent({ ...match, id: match.id || match._id });
            return;
          }
        }
      } catch {
        // Fallback to local
      }

      initializeAdminData().finally(() => {
        if (isMounted) {
          setEvent(findEvent(getStoredEvents(), id));
        }
      });
    }

    loadEvent();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const active = useMemo(() => isItemActive(event), [event]);
  const dateInfo = useMemo(() => resolveItemDates(event), [event]);
  const bookingEndDate = useMemo(() => getEventBookingEndDate(event), [event]);
  const validDates = useMemo(() => generateValidBookingDates(event, 7), [event]);

  if (!event) {
    return (
      <div className="event-details-page empty-state">
        <h2>Event not found</h2>
        <p>Please check the event link or go back to the Events page.</p>
        <button className="back-btn" onClick={() => navigate("/events")}>
          Go Back
        </button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="event-details-page empty-state" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎭</div>
        <h2 style={{ fontSize: "24px", color: "#111827", marginBottom: "8px" }}>Event Passes Closed</h2>
        <p style={{ fontSize: "15px", color: "#6b7280", maxWidth: "500px", margin: "0 auto 24px" }}>
          Pass bookings closed on <strong>{formatDisplayDate(bookingEndDate)}</strong>. Ticket bookings are no longer available for this show.
        </p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => navigate("/events")}
          style={{ padding: "12px 28px", borderRadius: "8px", cursor: "pointer", background: "linear-gradient(135deg, #f84464 0%, #e11d48 100%)", color: "#fff", border: "none", fontWeight: "600" }}
        >
          Explore Other Live Events
        </button>
      </div>
    );
  }

  const showtimes = event?.showtimes && event.showtimes.length > 0
    ? event.showtimes
    : [
        { time: "4:00 PM", venue: event.venue || "Venue to be announced" },
        { time: "7:30 PM", venue: event.venue || "Venue to be announced" },
      ];

  const selectedDateStr = validDates[selectedDateIndex]?.fullDate || validDates[0]?.fullDate || event.date;
  const usesSeatMap = isConcertEvent(event) && !isCafeEvent(event) && !isComedyEvent(event);
  const { venueName, location: eventLocation } = getVenueDetails(event);

  const handleStartBooking = () => {
    if (!showtimes.length) return;
    const firstSlot = showtimes[0];
    navigate(
      usesSeatMap
        ? `/events/${event.id}/seats`
        : `/events/${event.id}/pass`,
      { state: { event, slot: firstSlot, selectedDate: selectedDateStr } }
    );
  };

  return (
    <div className="event-details-page">
      <div className="event-details-card">
        <div className="event-poster-panel">
          <img src={event.poster} alt={event.title} className="event-banner" />
          {event.rating && (
            <div className="event-rating">
              <span aria-hidden="true">★</span> {event.rating} <span className="rating-caption">/ 10</span>
            </div>
          )}
        </div>

        <div className="event-details-right">
          <div className="event-details-main">
            <p className="section-kicker">{event.type || event.category || "Live event"}</p>
            <h2 className="event-title">{event.title}</h2>
            <p className="event-desc">{event.description}</p>

            <div className="event-meta-grid">
              <div className="detail-box">
                <span className="detail-label">Venue</span>
                <strong>{venueName}</strong>
              </div>
              <div className="detail-box detail-location-box">
                <span className="detail-label">Area & city</span>
                <strong>{eventLocation}</strong>
                {eventLocation !== "Location to be announced" && (
                  <a
                    className="location-link"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventLocation)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                  </a>
                )}
              </div>
              <div className="detail-box">
                <span className="detail-label">{dateInfo.startDate === dateInfo.endDate ? "Event date" : "Event dates"}</span>
                <strong>
                  {dateInfo.startDate === dateInfo.endDate
                    ? formatDisplayDate(dateInfo.startDate)
                    : `${formatDisplayDate(dateInfo.startDate)} - ${formatDisplayDate(dateInfo.endDate)}`}
                </strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Tickets from</span>
                <strong>{event.price != null ? `₹${event.price}` : "Price to be announced"}</strong>
              </div>
            </div>

            {validDates.length > 1 && (
              <div className="event-date-picker">
                <span className="date-picker-label">Choose an event date</span>
                <div className="event-date-options">
                  {validDates.map((d, idx) => (
                    <button
                      key={d.ymd}
                      type="button"
                      onClick={() => setSelectedDateIndex(idx)}
                      className={`event-date-option${selectedDateIndex === idx ? " is-selected" : ""}`}
                    >
                      {d.label} ({d.dateNumber} {d.month})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h3 className="showtime-title">Available Showtimes</h3>
            <div className="showtime-list">
              {showtimes.map((slot, index) => (
                <div key={index} className="showtime-item">
                  <div>
                    <strong>{slot.time}</strong>
                    <p>{getShowtimeVenueName(slot.venue || venueName, venueName)}</p>
                  </div>
                  <button
                    className="book-btn"
                    onClick={() =>
                      usesSeatMap
                        ? navigate(`/events/${event.id}/seats`, { state: { event, slot, selectedDate: selectedDateStr } })
                        : navigate(`/events/${event.id}/pass`, { state: { event, slot, selectedDate: selectedDateStr } })
                    }
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="event-action-panel">
            <div className="event-action-box">
              <button className="book-btn" onClick={handleStartBooking}>
                Book Tickets
              </button>
              <p className="booking-copy">
                {formatDisplayDate(selectedDateStr)} · Choose a showtime to continue
              </p>
            </div>
          </div>

          <div className="review-box">
            <ReviewSection itemId={event.id} itemType="event" itemTitle={event.title} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
