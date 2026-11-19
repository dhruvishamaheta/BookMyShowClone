import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredEvents, saveEvents } from "../../utils/adminData";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import { paginateItems, sortAdminItems } from "../../utils/adminListUtils";
import { uploadImageToCloudinary } from "../../utils/cloudinaryUpload";
import { getItemDateStatus, getTodayYMD, getOffsetDateYMD, resolveItemDates } from "../../utils/dateUtils";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

const EVENT_TYPE_OPTIONS = [
  "Standup Comedy",
  "Music Concert",
  "Theatre Play",
  "Live Performance",
  "Dance Show",
  "Food & Drinks",
  "Workshop & Masterclass",
  "Exhibition & Expo",
  "Storytelling & Poetry",
  "Meetup & Networking",
  "Talk Show",
  "Kids & Family",
  "Other",
];

const emptyForm = {
  title: "",
  poster: "",
  category: "auditorium",
  type: "Standup Comedy",
  venue: "",
  date: getTodayYMD(),
  startDate: getTodayYMD(),
  endDate: getTodayYMD(),
  price: "499",
  description: "",
  showtimesText: "06:00 PM | Main Auditorium\n08:30 PM | Main Auditorium",
};

function createEventId(title) {
  return `event-${
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || Date.now()
  }`;
}

function formatShowtimes(showtimes) {
  if (!showtimes || !Array.isArray(showtimes) || showtimes.length === 0) {
    return "07:00 PM | Main Hall";
  }
  return showtimes
    .map((slot) => `${slot.time || "07:00 PM"}${slot.venue ? ` | ${slot.venue}` : ""}`)
    .join("\n");
}

function parseShowtimes(showtimesText, fallbackVenue) {
  return showtimesText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [timePart, venuePart] = line.split("|").map((part) => part.trim());
      return {
        time: timePart || "07:00 PM",
        venue: venuePart || fallbackVenue || "Auditorium",
      };
    })
    .filter((slot) => slot.time);
}

function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(() => getStoredEvents());
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [toast, setToast] = useState("");
  const [uploadingPoster, setUploadingPoster] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(
    () => ["All", ...new Set(events.map((e) => e.category).filter(Boolean))],
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = events.filter((e) => {
      const matchesQuery =
        !query ||
        [e.title, e.type, e.venue, e.category, e.description]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCat = categoryFilter === "All" || e.category === categoryFilter;
      
      const statusObj = getItemDateStatus(e);
      const matchesStatus = statusFilter === "All" || statusObj.status === statusFilter;

      return matchesQuery && matchesCat && matchesStatus;
    });
    return sortAdminItems(base, sortBy);
  }, [categoryFilter, statusFilter, events, search, sortBy]);

  const pagedEvents = useMemo(
    () => paginateItems(filteredEvents, page, pageSize),
    [filteredEvents, page, pageSize]
  );

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setFormErrors({});
    setShowEditor(true);
  };

  const openEdit = (eventItem) => {
    setEditingId(eventItem.id);
    setFormErrors({});
    const { startDate, endDate } = resolveItemDates(eventItem);
    setForm({
      title: eventItem.title || "",
      poster: eventItem.poster || "",
      category: eventItem.category || "auditorium",
      type: eventItem.type || "Standup Comedy",
      venue: eventItem.venue || "",
      date: eventItem.date || startDate,
      startDate: eventItem.startDate || startDate,
      endDate: eventItem.endDate || endDate,
      price: eventItem.price?.toString?.() || "499",
      description: eventItem.description || "",
      showtimesText: formatShowtimes(eventItem.showtimes),
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingId("");
    setForm(emptyForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) {
      errors.title = "Event title is required.";
    } else if (form.title.trim().length < 2) {
      errors.title = "Title must be at least 2 characters.";
    }

    if (!form.poster.trim()) {
      errors.poster = "Poster image URL or path is required.";
    }

    if (!form.venue.trim()) {
      errors.venue = "Venue / Location is required.";
    }

    if (!form.startDate) {
      errors.startDate = "Event start date is required.";
    }

    if (!form.endDate) {
      errors.endDate = "Event end date is required.";
    } else if (form.startDate && form.endDate < form.startDate) {
      errors.endDate = "End date must be on or after start date.";
    }

    const numPrice = Number(form.price);
    if (form.price === "" || isNaN(numPrice) || numPrice < 0) {
      errors.price = "Valid ticket price is required (0 or greater).";
    }

    if (!form.description.trim()) {
      errors.description = "Event description is required.";
    } else if (form.description.trim().length < 10) {
      errors.description = "Description should be at least 10 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const title = form.title.trim();
    const price = Number(form.price) || 0;

    const nextEvent = {
      id: editingId || createEventId(title),
      title,
      poster: form.poster.trim(),
      category: form.category,
      type: form.type.trim(),
      venue: form.venue.trim(),
      date: form.date?.trim?.() || form.startDate,
      startDate: form.startDate,
      endDate: form.endDate,
      createdAt: editingId
        ? events.find((eventItem) => eventItem.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      price,
      description: form.description.trim(),
      showtimes: parseShowtimes(form.showtimesText, form.venue.trim()),
    };

    const updated = editingId
      ? events.map((curr) => (curr.id === editingId ? nextEvent : curr))
      : [nextEvent, ...events];

    try {
      const savedEvents = await saveEvents(updated);
      setEvents(savedEvents);
      closeEditor();
      setToast(editingId ? `Event "${title}" updated successfully.` : `Event "${title}" created successfully.`);
    } catch (error) {
      setToast(error?.message || `Unable to save "${title}". Please try again.`);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const updated = events.filter((e) => e.id !== deleteTarget.id);
    try {
      await saveEvents(updated);
      setEvents(updated);
      if (editingId === deleteTarget.id) closeEditor();
      const deletedTitle = deleteTarget.title;
      setDeleteTarget(null);
      setToast(`Event "${deletedTitle}" deleted successfully.`);
    } catch (error) {
      setToast(error?.message || `Unable to delete "${deleteTarget.title}". Please try again.`);
    }
  };

  return (
    <div>
      {/* Header Card */}
      <div className="admin-card">
        <div className="admin-card-header admin-card-header-centered">
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>Event Management</h2>
            <p>Administer live comedy shows, concerts, plays, and set active ticket booking start and end dates.</p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <span>+ Create Event</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-box">
            <svg
              className="admin-search-svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search events by title, venue, type..."
            />
          </div>

          <div className="admin-filters-group">
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Status</option>
              <option value="active">Active (Bookable Now)</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired / Ended</option>
            </select>

            <select
              className="admin-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>

            <select
              className="admin-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="alphabetical">Title (A-Z)</option>
              <option value="price">Price (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Content Table View Only */}
        {filteredEvents.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Events Found</h3>
            <p>Try adjusting your search criteria or create a new live event.</p>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate}>
              + Add Event
            </button>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Details</th>
                  <th>Category & Type</th>
                  <th>Venue</th>
                  <th>Show Dates (Start - End)</th>
                  <th>Status</th>
                  <th>Ticket Price</th>
                  <th>Slots</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedEvents.items.map((ev) => {
                  const statusObj = getItemDateStatus(ev);
                  const eventSlots =
                    Array.isArray(ev.showtimes) && ev.showtimes.length > 0
                      ? ev.showtimes
                      : [{ time: "07:00 PM", venue: ev.venue || "Auditorium" }];

                  return (
                    <tr key={ev.id}>
                      <td>
                        <div className="admin-item-cell">
                          <img
                            src={ev.poster}
                            alt={ev.title}
                            className="admin-table-thumb"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/100x140?text=Event";
                            }}
                          />
                          <div className="admin-item-cell-info">
                            <strong>{ev.title}</strong>
                            <small>{ev.description?.slice(0, 36)}...</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-red" style={{ marginRight: "4px" }}>
                          {ev.category}
                        </span>
                        <small style={{ display: "block", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                          {ev.type}
                        </small>
                      </td>
                      <td>
                        <span>{ev.venue}</span>
                      </td>
                      <td>
                        <div className="admin-dates-cell">
                          <div className="admin-dates-range">
                            <span>📅 {statusObj.startDateFormatted}</span>
                            {statusObj.endDate !== statusObj.startDate && (
                              <>
                                <span>→</span>
                                <span>{statusObj.endDateFormatted}</span>
                              </>
                            )}
                          </div>
                          <span className="admin-dates-hint">
                            {statusObj.status === "expired"
                              ? `Booking closed ${statusObj.bookingEndDateFormatted}`
                              : `Book passes through ${statusObj.bookingEndDateFormatted}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${statusObj.badgeClass}`}>
                          <span className="badge-dot" />
                          {statusObj.label}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "var(--admin-red-primary)" }}>₹{ev.price}</strong>
                      </td>
                      <td>
                        <div className="admin-slots-list">
                          {eventSlots.map((slot, idx) => (
                            <div key={idx} className="admin-slot-line">
                              <span className="admin-slot-time">{slot.time}</span>
                              {slot.venue && <span className="admin-slot-sep">|</span>}
                              {slot.venue && <span className="admin-slot-venue">{slot.venue}</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="admin-actions-group">
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => openEdit(ev)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => setDeleteTarget(ev)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredEvents.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing <strong>{pagedEvents.startIndex}</strong> to <strong>{pagedEvents.endIndex}</strong> of{" "}
              <strong>{pagedEvents.totalItems}</strong> events
            </div>
            <div className="admin-pagination-controls">
              <button
                type="button"
                className="admin-page-btn"
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                disabled={page === 1}
              >
                ← Prev
              </button>
              {Array.from({ length: pagedEvents.totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`admin-page-btn ${num === page ? "active" : ""}`}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="admin-page-btn"
                onClick={() => setPage((c) => Math.min(pagedEvents.totalPages, c + 1))}
                disabled={page === pagedEvents.totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Create / Edit Modal with Validation */}
      {showEditor && (
        <AdminModal
          title={editingId ? "Edit Event Details" : "Create New Event"}
          onClose={closeEditor}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={closeEditor}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={handleSubmit}
              >
                {editingId ? "Save Event Changes" : "Create & Publish Event"}
              </button>
            </>
          }
        >
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Event Title <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.title ? "has-error" : ""}`}
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: "" });
                  }}
                  placeholder="e.g. Zakir Khan Live Standup"
                />
                {formErrors.title && <span className="admin-field-error">{formErrors.title}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Category <span className="admin-required-star">*</span>
                </label>
                <select
                  className="admin-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="auditorium">Auditorium / Stadium</option>
                  <option value="cafe">Cafe & Club</option>
                  <option value="comedy">Standup Comedy</option>
                  <option value="music">Music Concert</option>
                  <option value="theatre">Theatre Play</option>
                  <option value="workshop">Creative Workshop</option>
                </select>
              </div>
            </div>

            {/* Actual event date range; concert booking has a separate automatic cutoff. */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Event Start Date <span className="admin-required-star">*</span>
                </label>
                <input
                  type="date"
                  className={`admin-input ${formErrors.startDate ? "has-error" : ""}`}
                  value={form.startDate}
                  onChange={(e) => {
                    setForm((current) => ({
                      ...current,
                      startDate: e.target.value,
                      date: e.target.value,
                      endDate: current.endDate === current.startDate ? e.target.value : current.endDate,
                    }));
                    if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: "" });
                  }}
                />
                {formErrors.startDate && <span className="admin-field-error">{formErrors.startDate}</span>}
                <small style={{ color: "var(--admin-text-muted)", fontSize: "11px" }}>
                  First day of the event.
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Event End Date <span className="admin-required-star">*</span>
                </label>
                <input
                  type="date"
                  className={`admin-input ${formErrors.endDate ? "has-error" : ""}`}
                  value={form.endDate}
                  onChange={(e) => {
                    setForm({ ...form, endDate: e.target.value });
                    if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: "" });
                  }}
                />
                {formErrors.endDate && <span className="admin-field-error">{formErrors.endDate}</span>}
                <small style={{ color: "var(--admin-text-muted)", fontSize: "11px" }}>
                  Last day of the event. Concert bookings close one day before the start date.
                </small>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-label">
                Poster Image URL / Path <span className="admin-required-star">*</span>
              </label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  className={`admin-input ${formErrors.poster ? "has-error" : ""}`}
                  value={form.poster}
                  onChange={(e) => {
                    setForm({ ...form, poster: e.target.value });
                    if (formErrors.poster) setFormErrors({ ...formErrors, poster: "" });
                  }}
                  placeholder="e.g. https://res.cloudinary.com/... or /src/assets/events1.png"
                  style={{ flex: 1 }}
                />
                <label
                  className="admin-btn admin-btn-outline"
                  style={{
                    cursor: uploadingPoster ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    margin: 0,
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    disabled={uploadingPoster}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploadingPoster(true);
                        setToast("Uploading event poster to Cloudinary...");
                        const cdnUrl = await uploadImageToCloudinary(file, "bookmyshow/events");
                        setForm((prev) => ({ ...prev, poster: cdnUrl }));
                        if (formErrors.poster) setFormErrors((prev) => ({ ...prev, poster: "" }));
                        setToast("Event poster uploaded to Cloudinary successfully!");
                        setTimeout(() => setToast(""), 3500);
                      } catch (err) {
                        console.error("Cloudinary upload failed:", err);
                        setToast("Upload failed: " + (err.response?.data?.message || err.message));
                        setTimeout(() => setToast(""), 4500);
                      } finally {
                        setUploadingPoster(false);
                      }
                    }}
                  />
                  <span>{uploadingPoster ? "Uploading..." : "☁️ Upload via Cloudinary"}</span>
                </label>
              </div>
              {formErrors.poster && <span className="admin-field-error">{formErrors.poster}</span>}

              {form.poster && (
                <div className="admin-poster-preview-box">
                  <img
                    src={form.poster}
                    alt="Event Preview"
                    className="admin-poster-preview-img"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/80x100?text=Invalid";
                    }}
                  />
                  <div className="admin-poster-preview-text">
                    <span>✓ Event Poster Loaded</span>
                    <small style={{ display: "block", color: "var(--admin-text-muted)" }}>
                      {form.poster.includes("cloudinary.com") ? "☁️ Hosted on Cloudinary CDN" : "Live image is verified for listing card."}
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Event Type <span className="admin-required-star">*</span>
                </label>
                <select
                  className="admin-input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {EVENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Ticket Price (₹) <span className="admin-required-star">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={`admin-input ${formErrors.price ? "has-error" : ""}`}
                  value={form.price}
                  onChange={(e) => {
                    setForm({ ...form, price: e.target.value });
                    if (formErrors.price) setFormErrors({ ...formErrors, price: "" });
                  }}
                  placeholder="499"
                />
                {formErrors.price && <span className="admin-field-error">{formErrors.price}</span>}
              </div>
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-label">
                Venue / Location <span className="admin-required-star">*</span>
              </label>
              <input
                type="text"
                className={`admin-input ${formErrors.venue ? "has-error" : ""}`}
                value={form.venue}
                onChange={(e) => {
                  setForm({ ...form, venue: e.target.value });
                  if (formErrors.venue) setFormErrors({ ...formErrors, venue: "" });
                }}
                placeholder="e.g. Pandit Dindayal Upadhyay Auditorium, Rajkot"
              />
              {formErrors.venue && <span className="admin-field-error">{formErrors.venue}</span>}
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-label">
                Event Description <span className="admin-required-star">*</span>
              </label>
              <textarea
                rows="3"
                className={`admin-textarea ${formErrors.description ? "has-error" : ""}`}
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: "" });
                }}
                placeholder="Details regarding performers, duration, language, and event highlights..."
              />
              {formErrors.description && (
                <span className="admin-field-error">{formErrors.description}</span>
              )}
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-label">
                Event Slots (1 Slot per line — Time | Venue)
              </label>
              <textarea
                rows="3"
                className="admin-textarea"
                value={form.showtimesText}
                onChange={(e) => setForm({ ...form, showtimesText: e.target.value })}
                placeholder="06:00 PM | Main Auditorium&#10;08:30 PM | Main Auditorium"
              />
              <div className="admin-slot-helper-text">
                <small>Format: <code>06:00 PM | Main Auditorium</code> (One slot per line)</small>
              </div>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Confirm Event Deletion"
          size="sm"
          onClose={() => setDeleteTarget(null)}
          actions={
            <>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={confirmDelete}
              >
                Yes, Delete Event
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-text-main)", marginBottom: "10px" }}>
              Are you sure you want to delete this event:
            </p>
            <strong style={{ fontSize: "17px", color: "var(--admin-red-primary)" }}>
              {deleteTarget.title}
            </strong>
            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "10px" }}>
              This will remove the event listing and its pass booking slots permanently.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Toast */}
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </div>
  );
}

export default AdminEvents;
