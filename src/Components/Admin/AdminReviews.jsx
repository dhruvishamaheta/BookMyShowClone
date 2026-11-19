import { useState, useEffect, useMemo } from "react";
import {
  getAllReviewsAdmin,
  updateReviewAdmin,
  deleteReviewAdmin,
} from "../../utils/ticketStorage";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

const CATEGORY_COLORS = {
  Movie: "#3b82f6",
  Event: "#8b5cf6",
  Sport: "#10b981",
  Activity: "#f97316",
  General: "#64748b",
};

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedReview, setSelectedReview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getAllReviewsAdmin();
      setReviews(data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    await updateReviewAdmin(reviewId, { status: newStatus });
    setReviews((prev) =>
      prev.map((r) =>
        (r.id === reviewId || r._id === reviewId ? { ...r, status: newStatus } : r)
      )
    );
    if (
      selectedReview &&
      (selectedReview.id === reviewId || selectedReview._id === reviewId)
    ) {
      setSelectedReview((prev) => ({ ...prev, status: newStatus }));
    }
    showToast(`Review status marked as "${newStatus}"`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id || deleteTarget._id;
    await deleteReviewAdmin(targetId);
    setReviews((prev) =>
      prev.filter((r) => r.id !== targetId && r._id !== targetId)
    );
    if (
      selectedReview &&
      (selectedReview.id === targetId || selectedReview._id === targetId)
    ) {
      setSelectedReview(null);
    }
    setDeleteTarget(null);
    showToast("Review deleted successfully");
  };

  // Metrics calculation
  const totalCount = reviews.length;
  const averageScore = useMemo(() => {
    if (!reviews.length) return "0.0";
    const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const fiveStarCount = reviews.filter(
    (r) => Math.round(Number(r.rating) || 5) === 5
  ).length;

  const uniqueUsersCount = useMemo(() => {
    const set = new Set();
    reviews.forEach((r) => {
      const key = r.userEmail || r.userId || r.userName;
      if (key) set.add(key);
    });
    return set.size;
  }, [reviews]);

  // Filtered & Sorted list
  const filteredReviews = useMemo(() => {
    let result = reviews.filter((r) => {
      const query = search.toLowerCase();
      const matchesSearch =
        (r.userName || "").toLowerCase().includes(query) ||
        (r.userEmail || "").toLowerCase().includes(query) ||
        (r.itemTitle || "").toLowerCase().includes(query) ||
        (r.comment || "").toLowerCase().includes(query) ||
        (r.itemId || "").toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all" ||
        (r.itemType || "Movie").toLowerCase() === typeFilter.toLowerCase();

      const matchesRating =
        ratingFilter === "all" ||
        Math.round(Number(r.rating) || 5) === Number(ratingFilter);

      const matchesStatus =
        statusFilter === "all" ||
        (r.status || "Approved").toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesType && matchesRating && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === "highest") return (Number(b.rating) || 5) - (Number(a.rating) || 5);
      if (sortBy === "lowest") return (Number(a.rating) || 5) - (Number(b.rating) || 5);
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return result;
  }, [reviews, search, typeFilter, ratingFilter, statusFilter, sortBy]);

  const getInitial = (name) => {
    return (name || "U").charAt(0).toUpperCase();
  };

  return (
    <div>
      {/* Toast Alert */}
      {toast && (
        <div className="admin-toast">
          <span>{toast}</span>
        </div>
      )}

      {/* Top Banner Card */}
      <div className="admin-card" style={{ marginBottom: "24px" }}>
        <div
          className="admin-card-header admin-card-header-centered"
          style={{ borderBottom: "none", paddingBottom: "0", marginBottom: "0" }}
        >
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>⭐ Customer Reviews & Ratings</h2>
            <p>
              Inspect which user reviewed which movie, concert, sport match, or activity. Manage ratings, moderate feedback, and oversee customer experiences.
            </p>
          </div>
          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-btn admin-btn-outline admin-btn-sm"
              onClick={loadReviews}
            >
              ↻ Refresh Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Stats Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total Reviews</span>
            <strong className="admin-stat-value">{totalCount}</strong>
            <span className="admin-stat-desc">Across all entertainment items</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Average Score</span>
            <strong className="admin-stat-value" style={{ color: "#f59e0b" }}>
              ★ {averageScore} <small style={{ fontSize: "14px", color: "#64748b" }}>/ 5.0</small>
            </strong>
            <span className="admin-stat-desc">Overall satisfaction rating</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">5-Star Ratings</span>
            <strong className="admin-stat-value" style={{ color: "#10b981" }}>
              {fiveStarCount}
            </strong>
            <span className="admin-stat-desc">
              {totalCount ? Math.round((fiveStarCount / totalCount) * 100) : 0}% of all reviews
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <span className="admin-stat-label">Active Reviewers</span>
            <strong className="admin-stat-value" style={{ color: "#3b82f6" }}>
              {uniqueUsersCount}
            </strong>
            <span className="admin-stat-desc">Unique verified customers</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls Card */}
      <div className="admin-card" style={{ marginBottom: "24px" }}>
        <div className="admin-filter-bar">
          <div className="admin-search-input-wrap">
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by user name, email, item title, or comment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="admin-filter-group">
            {/* Category Filter */}
            <select
              className="admin-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Movie">🎬 Movies</option>
              <option value="Event">🎟️ Events</option>
              <option value="Sport">⚽ Sports</option>
              <option value="Activity">🎡 Activities</option>
            </select>

            {/* Rating Filter */}
            <select
              className="admin-select"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
              <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
              <option value="3">⭐⭐⭐ (3 Stars)</option>
              <option value="2">⭐⭐ (2 Stars)</option>
              <option value="1">⭐ (1 Star)</option>
            </select>

            {/* Status Filter */}
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Flagged">Flagged</option>
            </select>

            {/* Sort Filter */}
            <select
              className="admin-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title-group">
            <h3>Review Submissions ({filteredReviews.length})</h3>
            <p>Showing user ratings linked with their registered account & target title</p>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">
            <div className="admin-spinner" />
            <p>Loading customer reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">⭐</div>
            <h4>No reviews found</h4>
            <p>No customer reviews match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User / Customer</th>
                  <th>Reviewed Item</th>
                  <th>Rating</th>
                  <th>Feedback Comment</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((rev) => {
                  const targetId = rev.id || rev._id;
                  const itemColor = CATEGORY_COLORS[rev.itemType] || "#64748b";
                  return (
                    <tr key={targetId}>
                      {/* User Cell */}
                      <td>
                        <div className="admin-user-cell">
                          {rev.userAvatar ? (
                            <img
                              src={rev.userAvatar}
                              alt={rev.userName}
                              className="admin-avatar-img"
                            />
                          ) : (
                            <div className="admin-avatar-initial">
                              {getInitial(rev.userName)}
                            </div>
                          )}
                          <div className="admin-user-info">
                            <strong className="admin-user-name">
                              {rev.userName || "Verified User"}
                            </strong>
                            <small className="admin-user-email">
                              {rev.userEmail || "Customer"}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Item Cell */}
                      <td>
                        <div className="admin-item-cell">
                          <span
                            className="admin-type-pill"
                            style={{
                              backgroundColor: `${itemColor}15`,
                              color: itemColor,
                              borderColor: `${itemColor}40`,
                            }}
                          >
                            {rev.itemType || "Movie"}
                          </span>
                          <strong className="admin-item-title">
                            {rev.itemTitle || "Entertainment Item"}
                          </strong>
                          <small className="admin-item-id">ID: {rev.itemId}</small>
                        </div>
                      </td>

                      {/* Rating Cell */}
                      <td>
                        <div className="admin-rating-cell">
                          <div className="admin-stars-row">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className={`admin-star-icon ${
                                  s <= (Number(rev.rating) || 5) ? "filled" : "empty"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="admin-rating-badge">
                            {rev.rating || 5}/5
                          </span>
                        </div>
                      </td>

                      {/* Comment Cell */}
                      <td style={{ maxWidth: "300px" }}>
                        <p className="admin-review-text-preview">{rev.comment}</p>
                        <small className="admin-review-date">{rev.createdAt}</small>
                      </td>

                      {/* Status Cell */}
                      <td>
                        <span
                          className={`admin-status-badge ${
                            rev.status === "Approved"
                              ? "status-approved"
                              : rev.status === "Flagged"
                              ? "status-flagged"
                              : "status-pending"
                          }`}
                        >
                          {rev.status || "Approved"}
                        </span>
                      </td>

                      {/* Action Cell */}
                      <td style={{ textAlign: "right" }}>
                        <div className="admin-actions-cell">
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => setSelectedReview(rev)}
                            title="View Full Review Details"
                          >
                            👁️ View
                          </button>

                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            onClick={() => setDeleteTarget(rev)}
                            title="Delete Review"
                          >
                            🗑️
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
      </div>

      {/* Review Details Inspection Modal */}
      {selectedReview && (
        <AdminModal
          title="Customer Review & Rating Details"
          onClose={() => setSelectedReview(null)}
        >
          <div className="admin-review-modal-content">
            {/* User Profile Header */}
            <div className="admin-modal-user-card">
              {selectedReview.userAvatar ? (
                <img
                  src={selectedReview.userAvatar}
                  alt={selectedReview.userName}
                  className="admin-modal-avatar-img"
                />
              ) : (
                <div className="admin-modal-avatar-initial">
                  {getInitial(selectedReview.userName)}
                </div>
              )}
              <div>
                <h4 className="admin-modal-user-name">
                  {selectedReview.userName || "Verified User"}
                </h4>
                <p className="admin-modal-user-email">
                  {selectedReview.userEmail || "No email provided"}
                </p>
                {selectedReview.userId && (
                  <span className="admin-modal-user-id">
                    User ID: {selectedReview.userId}
                  </span>
                )}
              </div>
            </div>

            {/* Item & Rating Details Grid */}
            <div className="admin-modal-grid">
              <div className="admin-modal-field">
                <span className="admin-modal-label">Reviewed Title:</span>
                <strong>{selectedReview.itemTitle}</strong>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Category / Type:</span>
                <span className="admin-modal-category-badge">
                  {selectedReview.itemType || "Movie"}
                </span>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Given Rating Score:</span>
                <div className="admin-modal-stars-row">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`admin-star-icon ${
                        s <= (Number(selectedReview.rating) || 5) ? "filled" : "empty"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <strong>{selectedReview.rating || 5} / 5 Stars</strong>
                </div>
              </div>

              <div className="admin-modal-field">
                <span className="admin-modal-label">Date Submitted:</span>
                <span>{selectedReview.createdAt}</span>
              </div>
            </div>

            {/* Written Comment Block */}
            <div className="admin-modal-comment-box">
              <span className="admin-modal-label">Customer Feedback:</span>
              <p className="admin-modal-comment-text">{selectedReview.comment}</p>
            </div>

            {/* Moderation Controls */}
            <div className="admin-modal-moderation">
              <span className="admin-modal-label">Change Moderation Status:</span>
              <div className="admin-modal-status-btns">
                <button
                  type="button"
                  className={`admin-status-pill-btn ${
                    selectedReview.status === "Approved" ? "active-approved" : ""
                  }`}
                  onClick={() =>
                    handleStatusChange(
                      selectedReview.id || selectedReview._id,
                      "Approved"
                    )
                  }
                >
                  ✓ Approved
                </button>
                <button
                  type="button"
                  className={`admin-status-pill-btn ${
                    selectedReview.status === "Pending" ? "active-pending" : ""
                  }`}
                  onClick={() =>
                    handleStatusChange(
                      selectedReview.id || selectedReview._id,
                      "Pending"
                    )
                  }
                >
                  ⏳ Pending
                </button>
                <button
                  type="button"
                  className={`admin-status-pill-btn ${
                    selectedReview.status === "Flagged" ? "active-flagged" : ""
                  }`}
                  onClick={() =>
                    handleStatusChange(
                      selectedReview.id || selectedReview._id,
                      "Flagged"
                    )
                  }
                >
                  ⚠ Flagged
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={() => setSelectedReview(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => {
                  const target = selectedReview;
                  setSelectedReview(null);
                  setDeleteTarget(target);
                }}
              >
                🗑️ Delete Review
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Confirm Delete Review"
          onClose={() => setDeleteTarget(null)}
        >
          <div className="admin-delete-modal">
            <p>
              Are you sure you want to permanently delete the review submitted by{" "}
              <strong>{deleteTarget.userName || "this user"}</strong> for{" "}
              <strong>"{deleteTarget.itemTitle}"</strong>?
            </p>
            <p style={{ color: "#ef4444", fontSize: "13px" }}>
              This action cannot be undone.
            </p>
            <div className="admin-modal-footer">
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
                Yes, Delete Review
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

export default AdminReviews;
