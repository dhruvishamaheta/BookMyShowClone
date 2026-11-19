import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredSports, saveSports } from "../../utils/adminData";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import { paginateItems, sortAdminItems } from "../../utils/adminListUtils";
import { uploadImageToCloudinary } from "../../utils/cloudinaryUpload";
import { getItemDateStatus, getTodayYMD, getOffsetDateYMD, resolveItemDates } from "../../utils/dateUtils";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

const SPORT_CATEGORIES = [
  "Cricket",
  "Football",
  "Badminton",
  "Tennis",
  "Marathon",
  "Motorsports",
  "Table Tennis",
  "Basketball",
  "Esports",
  "Other Sports",
];

const emptyForm = {
  title: "",
  poster: "",
  category: "Cricket",
  venue: "",
  date: getTodayYMD(),
  startDate: getTodayYMD(),
  endDate: "2026-12-30",
  price: "800",
  desc: "",
  timesText: "07:30 PM\n03:30 PM",
};

function createSportKey(title) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `sport-${Date.now()}`
  );
}

function formatTimes(times) {
  if (!times || !Array.isArray(times) || times.length === 0) {
    return "07:30 PM";
  }
  return times.join("\n");
}

function parseTimes(timesText) {
  return timesText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function AdminSports() {
  const navigate = useNavigate();
  const [sports, setSports] = useState(() => getStoredSports());
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingKey, setEditingKey] = useState("");
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

  const sportsList = useMemo(
    () => Object.entries(sports).map(([key, sport]) => ({ key, ...sport })),
    [sports]
  );

  const categories = useMemo(
    () => ["All", ...new Set(sportsList.map((s) => s.category).filter(Boolean))],
    [sportsList]
  );

  const filteredSports = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = sportsList.filter((s) => {
      const matchesQuery =
        !query ||
        [s.title, s.category, s.venue, s.desc]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCat = categoryFilter === "All" || s.category === categoryFilter;
      const statusObj = getItemDateStatus(s);
      const matchesStatus = statusFilter === "All" || statusObj.status === statusFilter;
      return matchesQuery && matchesCat && matchesStatus;
    });
    return sortAdminItems(base, sortBy);
  }, [categoryFilter, statusFilter, search, sortBy, sportsList]);

  const pagedSports = useMemo(
    () => paginateItems(filteredSports, page, pageSize),
    [filteredSports, page, pageSize]
  );

  const openCreate = () => {
    setEditingKey("");
    setForm(emptyForm);
    setFormErrors({});
    setShowEditor(true);
  };

  const openEdit = (sportItem) => {
    setEditingKey(sportItem.key);
    setFormErrors({});
    const { startDate, endDate } = resolveItemDates(sportItem);
    setForm({
      title: sportItem.title || "",
      poster: sportItem.poster || "",
      category: sportItem.category || "Cricket",
      venue: sportItem.venue || "",
      date: sportItem.date || startDate,
      startDate: sportItem.startDate || startDate,
      endDate: sportItem.endDate || endDate,
      price: sportItem.price?.toString?.() || "800",
      desc: sportItem.desc || "",
      timesText: formatTimes(sportItem.times),
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingKey("");
    setForm(emptyForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) {
      errors.title = "Match / Sport title is required.";
    } else if (form.title.trim().length < 2) {
      errors.title = "Title must be at least 2 characters.";
    }

    if (!form.poster.trim()) {
      errors.poster = "Poster image URL or path is required.";
    }

    if (!form.venue.trim()) {
      errors.venue = "Stadium / Arena venue is required.";
    }

    if (!form.startDate) {
      errors.startDate = "Tournament / Match start date is required.";
    }

    if (!form.endDate) {
      errors.endDate = "Tournament / Match end date is required.";
    } else if (form.startDate && form.endDate < form.startDate) {
      errors.endDate = "End date must be on or after start date.";
    }

    const numPrice = Number(form.price);
    if (form.price === "" || isNaN(numPrice) || numPrice < 0) {
      errors.price = "Valid ticket price is required.";
    }

    if (!form.desc.trim()) {
      errors.desc = "Description is required.";
    } else if (form.desc.trim().length < 10) {
      errors.desc = "Description should be at least 10 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const title = form.title.trim();
    const price = Number(form.price) || 0;
    const nextKey = editingKey || createSportKey(title);

    const nextSport = {
      title,
      poster: form.poster.trim(),
      category: form.category.trim(),
      venue: form.venue.trim(),
      date: form.date?.trim?.() || form.startDate,
      startDate: form.startDate,
      endDate: form.endDate,
      createdAt: editingKey
        ? sports[editingKey]?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      price,
      desc: form.desc.trim(),
      times: parseTimes(form.timesText),
    };

    const updated = { ...sports, [nextKey]: nextSport };
    setSports(updated);
    saveSports(updated);
    closeEditor();
    setToast(editingKey ? `Sport "${title}" updated successfully.` : `Sport "${title}" created successfully.`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { [deleteTarget.key]: _removed, ...rest } = sports;
    void _removed;
    setSports(rest);
    saveSports(rest);
    if (editingKey === deleteTarget.key) closeEditor();
    const deletedTitle = deleteTarget.title;
    setDeleteTarget(null);
    setToast(`Sport "${deletedTitle}" removed successfully.`);
  };

  return (
    <div>
      {/* Header Card */}
      <div className="admin-card">
        <div className="admin-card-header admin-card-header-centered">
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>Sports Management</h2>
            <p>Administer cricket tournaments, football matches, marathons, and esports events.</p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <span>+ Create Sport Match</span>
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
              placeholder="Search sports matches by team, venue, tournament, or sport..."
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
              <option value="All">All Statuses</option>
              <option value="active">Active (Selling)</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Ended / Expired</option>
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
                  {c === "All" ? "All Sports" : c}
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
        {filteredSports.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Sports Matches Found</h3>
            <p>Try adjusting your search criteria or add a new sports match.</p>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate}>
              + Add Sports Event
            </button>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Match / Event</th>
                  <th>Sport Type</th>
                  <th>Stadium / Venue</th>
                  <th>Match Dates (Start - End)</th>
                  <th>Status</th>
                  <th>Starting Price</th>
                  <th>Match Timings</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedSports.items.map((sport) => {
                  const statusObj = getItemDateStatus(sport);
                  return (
                    <tr key={sport.key}>
                      <td>
                        <div className="admin-item-cell">
                          <img
                            src={sport.poster}
                            alt={sport.title}
                            className="admin-table-thumb"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/100x140?text=Sports";
                            }}
                          />
                          <div className="admin-item-cell-info">
                            <strong>{sport.title}</strong>
                            <small>{sport.desc?.slice(0, 38)}...</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-red">{sport.category || "Cricket"}</span>
                      </td>
                      <td>
                        <span>{sport.venue}</span>
                      </td>
                      <td>
                        <div className="admin-dates-cell">
                          <div className="admin-dates-range">
                            <span>📅 {statusObj.startDateFormatted}</span>
                            <span>→</span>
                            <span>{statusObj.endDateFormatted}</span>
                          </div>
                          <span className="admin-dates-hint">
                            {statusObj.status === "expired" ? "Ended (Pass booking closed)" : "Passes available to buy"}
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
                        <strong style={{ color: "var(--admin-red-primary)" }}>₹{sport.price}</strong>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-gray">
                          {sport.times?.length || 1} Timings
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="admin-actions-group" style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => openEdit(sport)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => setDeleteTarget(sport)}
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
        {filteredSports.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing <strong>{pagedSports.startIndex}</strong> to <strong>{pagedSports.endIndex}</strong> of{" "}
              <strong>{pagedSports.totalItems}</strong> sports events
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
              {Array.from({ length: pagedSports.totalPages }, (_, i) => i + 1).map((num) => (
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
                onClick={() => setPage((c) => Math.min(pagedSports.totalPages, c + 1))}
                disabled={page === pagedSports.totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sports Create / Edit Modal with Validation */}
      {showEditor && (
        <AdminModal
          title={editingKey ? "Edit Sports Match" : "Create New Sports Match"}
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
                {editingKey ? "Save Sports Changes" : "Create & Publish Match"}
              </button>
            </>
          }
        >
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Match / Tournament Title <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.title ? "has-error" : ""}`}
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: "" });
                  }}
                  placeholder="e.g. Gujarat Titans vs Mumbai Indians"
                />
                {formErrors.title && <span className="admin-field-error">{formErrors.title}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Sport Type <span className="admin-required-star">*</span>
                </label>
                <select
                  className="admin-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {SPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start & End Date Selection */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Match / Tournament Start Date <span className="admin-required-star">*</span>
                </label>
                <input
                  type="date"
                  className={`admin-input ${formErrors.startDate ? "has-error" : ""}`}
                  value={form.startDate}
                  onChange={(e) => {
                    setForm({ ...form, startDate: e.target.value });
                    if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: "" });
                  }}
                />
                {formErrors.startDate && <span className="admin-field-error">{formErrors.startDate}</span>}
                <small style={{ color: "var(--admin-text-muted)", fontSize: "11px" }}>
                  First date when passes/tickets can be booked.
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Match / Tournament End Date (Pass Expiry) <span className="admin-required-star">*</span>
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
                  Pass purchase closes & match is removed from user side after this date.
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
                  placeholder="e.g. https://res.cloudinary.com/... or /src/assets/sports1.png"
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
                        setToast("Uploading sports poster to Cloudinary...");
                        const cdnUrl = await uploadImageToCloudinary(file, "bookmyshow/sports");
                        setForm((prev) => ({ ...prev, poster: cdnUrl }));
                        if (formErrors.poster) setFormErrors((prev) => ({ ...prev, poster: "" }));
                        setToast("Sports poster uploaded to Cloudinary successfully!");
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
                    alt="Sport Preview"
                    className="admin-poster-preview-img"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/80x100?text=Invalid";
                    }}
                  />
                  <div className="admin-poster-preview-text">
                    <span>✓ Sports Poster Verified</span>
                    <small style={{ display: "block", color: "var(--admin-text-muted)" }}>
                      {form.poster.includes("cloudinary.com") ? "☁️ Hosted on Cloudinary CDN" : "Live image verified for seating map & passes."}
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Stadium / Venue <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.venue ? "has-error" : ""}`}
                  value={form.venue}
                  onChange={(e) => {
                    setForm({ ...form, venue: e.target.value });
                    if (formErrors.venue) setFormErrors({ ...formErrors, venue: "" });
                  }}
                  placeholder="e.g. Narendra Modi Stadium, Ahmedabad"
                />
                {formErrors.venue && <span className="admin-field-error">{formErrors.venue}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Base Ticket Price (₹) <span className="admin-required-star">*</span>
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
                  placeholder="800"
                />
                {formErrors.price && <span className="admin-field-error">{formErrors.price}</span>}
              </div>
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-label">
                Match Timings (One per line)
              </label>
              <input
                type="text"
                className="admin-input"
                value={form.timesText}
                onChange={(e) => setForm({ ...form, timesText: e.target.value })}
                placeholder="Format: 07:30 PM"
              />
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-label">
                Match Description <span className="admin-required-star">*</span>
              </label>
              <textarea
                rows="3"
                className={`admin-textarea ${formErrors.desc ? "has-error" : ""}`}
                value={form.desc}
                onChange={(e) => {
                  setForm({ ...form, desc: e.target.value });
                  if (formErrors.desc) setFormErrors({ ...formErrors, desc: "" });
                }}
                placeholder="Details regarding teams, match format, gate entry rules, and stadium guidelines..."
              />
              {formErrors.desc && <span className="admin-field-error">{formErrors.desc}</span>}
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Confirm Sports Match Deletion"
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
                Yes, Delete Match
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-text-main)", marginBottom: "10px" }}>
              Are you sure you want to remove this sports match:
            </p>
            <strong style={{ fontSize: "17px", color: "var(--admin-red-primary)" }}>
              {deleteTarget.title}
            </strong>
            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "10px" }}>
              This will remove stadium seating and ticket booking slots permanently.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Toast */}
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </div>
  );
}

export default AdminSports;
