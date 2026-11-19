import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStoredActivities, initializeAdminData } from "../utils/adminData";
import { getActivitiesApi } from "../utils/api";
import { isItemActive, resolveItemDates, formatDisplayDate, generateValidBookingDates } from "../utils/dateUtils";
import ReviewSection from "./ReviewSection";
import "./EventDetails.css";

function normalizeActivities(items) {
  return (items || []).map((item) => ({
    ...item,
    id: item.id || item._id,
  }));
}

function findActivity(activities, targetId) {
  if (!activities || !targetId) return null;
  const decoded = decodeURIComponent(targetId).toLowerCase();
  return (
    activities.find(
      (item) =>
        item.id === targetId ||
        item._id === targetId ||
        String(item.id || "").toLowerCase() === decoded ||
        String(item._id || "").toLowerCase() === decoded ||
        String(item.title || "").toLowerCase() === decoded ||
        String(item.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-") === decoded
    ) || null
  );
}

function ActivityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(() => findActivity(getStoredActivities(), id));
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      try {
        const activities = await getActivitiesApi();
        const activitiesSource = Array.isArray(activities)
          ? activities
          : activities?.data && Array.isArray(activities.data)
          ? activities.data
          : [];

        if (activitiesSource.length > 0) {
          const nextActivity = findActivity(normalizeActivities(activitiesSource), id);
          if (isMounted && nextActivity) {
            setActivity(nextActivity);
            return;
          }
        }
      } catch {
        // Fallback to local
      }

      initializeAdminData().finally(() => {
        if (isMounted) {
          setActivity(findActivity(getStoredActivities(), id));
        }
      });
    }

    loadActivity();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const active = useMemo(() => isItemActive(activity), [activity]);
  const dateInfo = useMemo(() => resolveItemDates(activity), [activity]);
  const validDates = useMemo(() => generateValidBookingDates(activity, 7), [activity]);

  if (!activity) {
    return (
      <div className="event-details-page empty-state">
        <h2>Activity not found</h2>
        <p>Please check the activity link or go back to the Activities page.</p>
        <button className="back-btn" onClick={() => navigate("/activity")}>Go Back</button>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="event-details-page empty-state" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎟️</div>
        <h2 style={{ fontSize: "24px", color: "#111827", marginBottom: "8px" }}>Activity Passes Closed</h2>
        <p style={{ fontSize: "15px", color: "#6b7280", maxWidth: "500px", margin: "0 auto 24px" }}>
          Pass booking for <strong>{activity.title}</strong> has ended (ended on {formatDisplayDate(dateInfo.endDate)}). Please check our other exciting experiences.
        </p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => navigate("/activity")}
          style={{ padding: "12px 28px", borderRadius: "8px", cursor: "pointer", background: "linear-gradient(135deg, #f84464 0%, #e11d48 100%)", color: "#fff", border: "none", fontWeight: "600" }}
        >
          Explore Other Activities
        </button>
      </div>
    );
  }

  const selectedDateStr = validDates[selectedDateIndex]?.fullDate || validDates[0]?.fullDate || activity.date;

  return (
    <div className="event-details-page">
      <div className="event-details-card">
        <div className="event-poster-panel">
          <img src={activity.poster} alt={activity.title} className="event-banner" />
        </div>

        <div className="event-details-right">
          <div className="event-details-main">
            <p className="section-kicker">Trending Activity</p>
            <h2 className="event-title">{activity.title}</h2>
            <p className="event-desc">{activity.description}</p>

            <div className="event-meta-grid">
              <div className="detail-box">
                <span className="detail-label">Location</span>
                <strong>{activity.location}</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Operating Dates</span>
                <strong>
                  {dateInfo.startDate === dateInfo.endDate
                    ? formatDisplayDate(dateInfo.startDate)
                    : `${formatDisplayDate(dateInfo.startDate)} - ${formatDisplayDate(dateInfo.endDate)}`}
                </strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Hours / Slot</span>
                <strong>{activity.time}</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Pass Price</span>
                <strong>₹{activity.price}</strong>
              </div>
            </div>

            {/* Valid Date Selection Pills */}
            {validDates.length > 1 && (
              <div style={{ marginTop: "20px", marginBottom: "15px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  Select Visit Date:
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
          </div>

          <div className="event-action-panel">
            <div className="event-action-box">
              <button
                className="book-btn"
                onClick={() =>
                  navigate("/payment", {
                    state: {
                      activity,
                      selectedDate: selectedDateStr,
                      bookingType: "activity",
                    },
                  })
                }
              >
                Book Activity Pass
              </button>
              <p className="booking-copy">Instant digital pass confirmation with QR ticket.</p>
            </div>
          </div>

          <div className="review-box">
            <ReviewSection itemId={activity.id} itemType="activity" itemTitle={activity.title} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityDetails;
