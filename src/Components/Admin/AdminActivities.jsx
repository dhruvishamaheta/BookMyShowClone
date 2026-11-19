import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredActivities, saveActivities } from "../../utils/adminData";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import { paginateItems, sortAdminItems } from "../../utils/adminListUtils";
import { uploadImageToCloudinary } from "../../utils/cloudinaryUpload";
import { getItemDateStatus, getTodayYMD, getOffsetDateYMD, resolveItemDates } from "../../utils/dateUtils";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

const emptyForm = {
  title: "",
  poster: "",
  location: "",
  time: "10:00 AM - 08:00 PM",
  date: getTodayYMD(),
  startDate: getTodayYMD(),
  endDate: "2026-12-30",
  price: "350",
  description: "",
};

function createActivityId(title) {
  return `activity-${
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || Date.now()
  }`;
}

function AdminActivities() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState(() => getStoredActivities());
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
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

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = activities.filter((a) => {
      const matchesQuery =
        !query ||
        [a.title, a.location, a.description, a.time]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const statusObj = getItemDateStatus(a);
      const matchesStatus = statusFilter === "All" || statusObj.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
    return sortAdminItems(base, sortBy);
  }, [activities, search, statusFilter, sortBy]);

  const pagedActivities = useMemo(
    () => paginateItems(filteredActivities, page, pageSize),
    [filteredActivities, page, pageSize]
  );

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setFormErrors({});
    setShowEditor(true);
  };

  const openEdit = (activity) => {
    setEditingId(activity.id);
    setFormErrors({});
    const { startDate, endDate } = resolveItemDates(activity);
    setForm({
      title: activity.title || "",
      poster: activity.poster || "",
      location: activity.location || "",
      time: activity.time || "10:00 AM - 08:00 PM",
      date: activity.date || startDate,
      startDate: activity.startDate || startDate,
      endDate: activity.endDate || endDate,
      price: activity.price?.toString?.() || "350",
      description: activity.description || "",
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
      errors.title = "Activity title is required.";
    } else if (form.title.trim().length < 2) {
      errors.title = "Title must be at least 2 characters.";
    }

    if (!form.poster.trim()) {
      errors.poster = "Poster image URL or path is required.";
    }

    if (!form.location.trim()) {
      errors.location = "Location / Address is required.";
    }

    if (!form.startDate) {
      errors.startDate = "Start date is required.";
    }

    if (!form.endDate) {
      errors.endDate = "End date is required.";
    } else if (form.startDate && form.endDate < form.startDate) {
      errors.endDate = "End date must be on or after start date.";
    }

    if (!form.time.trim()) {
      errors.time = "Operating hours or time slot is required.";
    }

    const numPrice = Number(form.price);
    if (form.price === "" || isNaN(numPrice) || numPrice < 0) {
      errors.price = "Valid ticket price is required.";
    }

    if (!form.description.trim()) {
      errors.description = "Activity description is required.";
    } else if (form.description.trim().length < 10) {
      errors.description = "Description should be at least 10 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const title = form.title.trim();
    const price = Number(form.price) || 0;

    const nextActivity = {
      id: editingId || createActivityId(title),
      title,
      poster: form.poster.trim(),
      location: form.location.trim(),
      time: form.time.trim(),
      date: form.date?.trim?.() || form.startDate,
      startDate: form.startDate,
      endDate: form.endDate,
      createdAt: editingId
        ? activities.find((activity) => activity.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      price,
      description: form.description.trim(),
    };

    const updated = editingId
      ? activities.map((curr) => (curr.id === editingId ? nextActivity : curr))
      : [nextActivity, ...activities];

    setActivities(updated);
    saveActivities(updated);
    closeEditor();
    setToast(editingId ? `Activity "${title}" updated successfully.` : `Activity "${title}" created successfully.`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = activities.filter((a) => a.id !== deleteTarget.id);
    setActivities(updated);
    saveActivities(updated);
    if (editingId === deleteTarget.id) closeEditor();
    const deletedTitle = deleteTarget.title;
    setDeleteTarget(null);
    setToast(`Activity "${deletedTitle}" deleted successfully.`);
  };

  return (
    <div>
      {/* Header Card */}
      <div className="admin-card">
        <div className="admin-card-header admin-card-header-centered">
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>Activities Management</h2>
            <p>Administer amusement parks, waterparks, gaming arenas, and immersive experiences.</p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <span>+ Create Activity</span>
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
              placeholder="Search activities by title, location, or features..."
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="alphabetical">Title (A-Z)</option>
              <option value="price">Price (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Content Table View Only */}
        {filteredActivities.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Activities Found</h3>
            <p>Try adjusting your search criteria or create a new activity.</p>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate}>
              + Add Activity
            </button>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Activity Details</th>
                  <th>Location</th>
                  <th>Operating Dates (Start - End)</th>
                  <th>Status</th>
                  <th>Timings / Duration</th>
                  <th>Pass Price</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedActivities.items.map((act) => {
                  const statusObj = getItemDateStatus(act);
                  return (
                    <tr key={act.id}>
                      <td>
                        <div className="admin-item-cell">
                          <img
                            src={act.poster}
                            alt={act.title}
                            className="admin-table-thumb"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/100x140?text=Activity";
                            }}
                          />
                          <div className="admin-item-cell-info">
                            <strong>{act.title}</strong>
                            <small>{act.description?.slice(0, 42)}...</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span>{act.location}</span>
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
                        <span>{act.time}</span>
                      </td>
                      <td>
                        <strong style={{ color: "var(--admin-red-primary)" }}>₹{act.price}</strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="admin-actions-group" style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => openEdit(act)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => setDeleteTarget(act)}
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
        {filteredActivities.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing <strong>{pagedActivities.startIndex}</strong> to <strong>{pagedActivities.endIndex}</strong> of{" "}
              <strong>{pagedActivities.totalItems}</strong> activities
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
              {Array.from({ length: pagedActivities.totalPages }, (_, i) => i + 1).map((num) => (
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
                onClick={() => setPage((c) => Math.min(pagedActivities.totalPages, c + 1))}
                disabled={page === pagedActivities.totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Create / Edit Modal with Validation */}
      {showEditor && (
        <AdminModal
          title={editingId ? "Edit Activity Details" : "Create New Activity"}
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
                {editingId ? "Save Activity Changes" : "Create & Publish Activity"}
              </button>
            </>
          }
        >
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Activity Title <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.title ? "has-error" : ""}`}
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: "" });
                  }}
                  placeholder="e.g. Wonderland Waterpark Pass"
                />
                {formErrors.title && <span className="admin-field-error">{formErrors.title}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Pass Price (₹) <span className="admin-required-star">*</span>
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
                  placeholder="350"
                />
                {formErrors.price && <span className="admin-field-error">{formErrors.price}</span>}
              </div>
            </div>

            {/* Start & End Dates */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Operating Start Date <span className="admin-required-star">*</span>
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
                  First day when visitors can book tickets/passes.
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Operating End Date (Pass Expiry) <span className="admin-required-star">*</span>
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
                  Pass booking closes & activity is removed from user side after this date.
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
                  placeholder="e.g. https://res.cloudinary.com/... or /src/assets/activity1.png"
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
                        setToast("Uploading activity poster to Cloudinary...");
                        const cdnUrl = await uploadImageToCloudinary(file, "bookmyshow/activities");
                        setForm((prev) => ({ ...prev, poster: cdnUrl }));
                        if (formErrors.poster) setFormErrors((prev) => ({ ...prev, poster: "" }));
                        setToast("Activity poster uploaded to Cloudinary successfully!");
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
                    alt="Activity Preview"
                    className="admin-poster-preview-img"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/80x100?text=Invalid";
                    }}
                  />
                  <div className="admin-poster-preview-text">
                    <span>✓ Activity Poster Verified</span>
                    <small style={{ display: "block", color: "var(--admin-text-muted)" }}>
                      {form.poster.includes("cloudinary.com") ? "☁️ Hosted on Cloudinary CDN" : "Live image verified for listing pass cards."}
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Location / Address <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.location ? "has-error" : ""}`}
                  value={form.location}
                  onChange={(e) => {
                    setForm({ ...form, location: e.target.value });
                    if (formErrors.location) setFormErrors({ ...formErrors, location: "" });
                  }}
                  placeholder="e.g. Kalawad Road, Rajkot"
                />
                {formErrors.location && <span className="admin-field-error">{formErrors.location}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Timings / Slot <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.time ? "has-error" : ""}`}
                  value={form.time}
                  onChange={(e) => {
                    setForm({ ...form, time: e.target.value });
                    if (formErrors.time) setFormErrors({ ...formErrors, time: "" });
                  }}
                  placeholder="e.g. 10:00 AM - 08:00 PM"
                />
                {formErrors.time && <span className="admin-field-error">{formErrors.time}</span>}
              </div>
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-label">
                Activity Description <span className="admin-required-star">*</span>
              </label>
              <textarea
                rows="3"
                className={`admin-textarea ${formErrors.description ? "has-error" : ""}`}
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: "" });
                }}
                placeholder="Describe attractions, age recommendations, safety guidelines, and inclusion details..."
              />
              {formErrors.description && (
                <span className="admin-field-error">{formErrors.description}</span>
              )}
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Confirm Activity Deletion"
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
                Yes, Delete Activity
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-text-main)", marginBottom: "10px" }}>
              Are you sure you want to delete this activity:
            </p>
            <strong style={{ fontSize: "17px", color: "var(--admin-red-primary)" }}>
              {deleteTarget.title}
            </strong>
            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "10px" }}>
              This will remove the activity and all pass bookings associated with it.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Toast */}
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </div>
  );
}

export default AdminActivities;
