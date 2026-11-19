import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getStoredSports, initializeAdminData } from "../utils/adminData";
import { getSportsApi } from "../utils/api";
import { isItemActive, resolveItemDates, formatDisplayDate, generateValidBookingDates } from "../utils/dateUtils";
import ReviewSection from "./ReviewSection";
import "./SportsDetails.css";

function findSport(sportsObj, paramId) {
  if (!sportsObj || !paramId) return null;
  if (sportsObj[paramId]) return { ...sportsObj[paramId], key: paramId };
  const cleanId = paramId.replace(/^sport-/, "");
  if (sportsObj[cleanId]) return { ...sportsObj[cleanId], key: cleanId };

  const entries = Object.entries(sportsObj);
  for (const [key, value] of entries) {
    if (
      key.toLowerCase() === paramId.toLowerCase() ||
      key.toLowerCase() === cleanId.toLowerCase() ||
      value?.id === paramId ||
      value?._id === paramId ||
      value?.key === paramId ||
      value?.key === cleanId ||
      value?.title?.toLowerCase() === paramId.toLowerCase()
    ) {
      return { ...value, key };
    }
  }
  return null;
}

function SportsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sport, setSport] = useState(() => findSport(getStoredSports(), id));
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadSport() {
      try {
        const apiSports = await getSportsApi();
        const sportsSource = Array.isArray(apiSports)
          ? apiSports
          : apiSports?.data && Array.isArray(apiSports.data)
          ? apiSports.data
          : [];

        if (sportsSource.length > 0) {
          const sportsObject = {};
          sportsSource.forEach((item) => {
            const key = item.key || item.id || item._id || item.title;
            sportsObject[key] = { ...item, key };
          });
          const match = findSport(sportsObject, id);
          if (isMounted && match) {
            setSport(match);
            return;
          }
        }
      } catch {
        // Fallback to local
      }

      initializeAdminData().finally(() => {
        if (isMounted) {
          setSport(findSport(getStoredSports(), id));
        }
      });
    }

    loadSport();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const active = useMemo(() => isItemActive(sport), [sport]);
  const dateInfo = useMemo(() => resolveItemDates(sport), [sport]);
  const validDates = useMemo(() => generateValidBookingDates(sport, 7), [sport]);

  if (!sport) {
    return (
      <div className="details-page empty-state">
        <h2>Sport not found</h2>
        <p>Please check the link or go back to the Sports page.</p>
        <button className="back-btn" onClick={() => navigate("/sports")}>
          Go Back
        </button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="details-page empty-state" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🏆</div>
        <h2 style={{ fontSize: "24px", color: "#111827", marginBottom: "8px" }}>Match / Tournament Concluded</h2>
        <p style={{ fontSize: "15px", color: "#6b7280", maxWidth: "500px", margin: "0 auto 24px" }}>
          Ticket booking for <strong>{sport.title}</strong> has ended (ended on {formatDisplayDate(dateInfo.endDate)}). Stadium tickets and passes are no longer available.
        </p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => navigate("/sports")}
          style={{ padding: "12px 28px", borderRadius: "8px", cursor: "pointer", background: "linear-gradient(135deg, #f84464 0%, #e11d48 100%)", color: "#fff", border: "none", fontWeight: "600" }}
        >
          Explore Other Sports Matches
        </button>
      </div>
    );
  }

  const times = sport.times && sport.times.length > 0
    ? sport.times
    : ["10:00 AM", "2:00 PM", "6:00 PM"];

  const selectedDateStr = validDates[selectedDateIndex]?.fullDate || validDates[0]?.fullDate || sport.date;

  return (
    <div className="details-page">
      <div className="details-container">
        <div className="details-poster-panel">
          <img src={sport.poster} alt={sport.title} className="details-poster" />
        </div>

        <div className="details-right">
          <div className="details-main">
            <p className="section-kicker">Sports Experience</p>
            <h2 className="details-title">{sport.title}</h2>
            <p className="details-desc">{sport.description || sport.desc}</p>

            <div className="detail-grid">
              <div className="detail-box">
                <span className="detail-label">Venue</span>
                <strong>{sport.venue}</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Match Dates</span>
                <strong>
                  {dateInfo.startDate === dateInfo.endDate
                    ? formatDisplayDate(dateInfo.startDate)
                    : `${formatDisplayDate(dateInfo.startDate)} - ${formatDisplayDate(dateInfo.endDate)}`}
                </strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Category</span>
                <strong>{sport.category}</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Base Price</span>
                <strong>From ₹{sport.price}</strong>
              </div>
            </div>

            {/* Valid Date Selection Pills */}
            {validDates.length > 1 && (
              <div style={{ marginTop: "20px", marginBottom: "15px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Select Match Date:
                </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {validDates.map((d, idx) => (
                    <button
                      key={d.ymd}
                      type="button"
                      onClick={() => setSelectedDateIndex(idx)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: selectedDateIndex === idx ? "2px solid #f84464" : "1px solid #e5e7eb",
                        background: selectedDateIndex === idx ? "#fff1f2" : "#fff",
                        color: selectedDateIndex === idx ? "#e11d48" : "#374151",
                        fontWeight: selectedDateIndex === idx ? "700" : "500",
                        cursor: "pointer",
                        fontSize: "13px",
                      }}
                    >
                      {d.label} ({d.dateNumber} {d.month})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h3 className="slot-title">Available Match Slots</h3>
            <div className="slot-buttons">
              {times.map((time) => (
                <Link
                  key={time}
                  to={`/sports/${id}/seats`}
                  state={{ sport, time, selectedDate: selectedDateStr }}
                  className="slot-btn"
                >
                  Book Now • {time}
                </Link>
              ))}
            </div>
          </div>

          <div className="action-panel">
            <div className="action-box">
              <Link
                to={`/sports/${id}/seats`}
                state={{ sport, time: times[0], selectedDate: selectedDateStr }}
                className="action-btn"
              >
                Proceed to Seat Selection
              </Link>
              <p className="action-note">Choose your stand, bay, and seating view.</p>
            </div>
          </div>

          <div className="review-box">
            <ReviewSection itemId={sport.key || id} itemType="sport" itemTitle={sport.title} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SportsDetails;
