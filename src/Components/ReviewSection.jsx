import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "../utils/userStorage";
import { getStoredReviews, saveReview } from "../utils/ticketStorage";
import "./ReviewSection.css";

const RATING_TEXTS = {
  1: "Poor (1/5)",
  2: "Fair (2/5)",
  3: "Good (3/5)",
  4: "Very Good (4/5)",
  5: "Excellent! Loved it (5/5)",
};

function ReviewSection({ itemId, itemType = "Movie", itemTitle = "Title" }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [reviews, setReviews] = useState(() => getStoredReviews(itemId));
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    setReviews(getStoredReviews(itemId));
  }, [itemId]);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [reviews]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const reviewerName =
      currentUser?.name ||
      currentUser?.username ||
      guestName.trim() ||
      "Verified Audience";

    const reviewerEmail = currentUser?.email || guestEmail.trim() || "";
    const reviewerAvatar = currentUser?.profileImage || currentUser?.avatar || "";
    const reviewerId = currentUser?.id || currentUser?._id || `guest_${Date.now().toString().slice(-4)}`;

    const newReview = {
      id: `rev-${itemId}-${Date.now()}`,
      userId: reviewerId,
      userName: reviewerName,
      userEmail: reviewerEmail,
      userAvatar: reviewerAvatar,
      itemId: String(itemId),
      itemTitle: itemTitle,
      itemType: itemType,
      rating: Number(rating) || 5,
      comment: comment.trim(),
      status: "Approved",
      createdAt: new Date().toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updated = saveReview(itemId, newReview);
    setReviews(updated);
    setComment("");
    setRating(5);
    setHoverRating(0);
    setSuccessMsg("Thank you! Your review and rating have been posted.");
    setTimeout(() => setSuccessMsg(""), 4500);
  };

  const getInitial = (name) => {
    return (name || "U").charAt(0).toUpperCase();
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="bms-review-container">
      {/* Review Section Header */}
      <div className="bms-review-header">
        <div className="bms-review-header-left">
          <div className="bms-review-icon-badge">⭐</div>
          <div>
            <h3 className="bms-review-title">Reviews & Ratings</h3>
            <p className="bms-review-subtitle">
              Verified reviews from real moviegoers and event attendees
            </p>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="bms-review-score-box">
            <div className="bms-review-avg-num">{average}</div>
            <div className="bms-review-score-stars">
              <div className="bms-stars-display">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`bms-star-icon ${
                      star <= Math.round(Number(average)) ? "filled" : "empty"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="bms-review-count">
                {reviews.length} {reviews.length === 1 ? "Rating" : "Ratings"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Review Breakdown Bar */}
      {reviews.length > 0 && (
        <div className="bms-rating-breakdown">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = starCounts[star] || 0;
            const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
            return (
              <div key={star} className="bms-breakdown-row">
                <span className="bms-breakdown-label">{star} ★</span>
                <div className="bms-breakdown-track">
                  <div
                    className="bms-breakdown-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="bms-breakdown-val">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Form */}
      <form className="bms-review-form-card" onSubmit={handleSubmit}>
        <div className="bms-form-header">
          <h4>Rate & Review {itemTitle}</h4>
          <span className="bms-form-kicker">Share your genuine experience</span>
        </div>

        {/* User identification badge */}
        {currentUser ? (
          <div className="bms-reviewer-badge">
            {currentUser.profileImage || currentUser.avatar ? (
              <img
                src={currentUser.profileImage || currentUser.avatar}
                alt={currentUser.name || currentUser.username}
                className="bms-reviewer-avatar-img"
              />
            ) : (
              <div className="bms-reviewer-avatar-initial">
                {getInitial(currentUser.name || currentUser.username)}
              </div>
            )}
            <div className="bms-reviewer-info">
              <span className="bms-reviewer-name">
                {currentUser.name || currentUser.username}
              </span>
              <span className="bms-reviewer-email">
                {currentUser.email || "Verified Member"}
              </span>
            </div>
            <span className="bms-verified-tag">✔ Logged In</span>
          </div>
        ) : (
          <div className="bms-guest-row">
            <input
              type="text"
              placeholder="Your Name (optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="bms-guest-input"
            />
            <input
              type="email"
              placeholder="Your Email (optional)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="bms-guest-input"
            />
          </div>
        )}

        {/* Interactive Star Picker */}
        <div className="bms-star-picker-wrap">
          <label className="bms-star-label">Your Rating Score:</label>
          <div
            className="bms-star-picker"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className={`bms-star-btn ${star <= activeRating ? "active" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                aria-label={`Rate ${star} out of 5 stars`}
              >
                ★
              </button>
            ))}
            <span className="bms-star-feedback-text">
              {RATING_TEXTS[activeRating] || `${activeRating}/5`}
            </span>
          </div>
        </div>

        {/* Written Review */}
        <div className="bms-textarea-wrap">
          <label className="bms-textarea-label" htmlFor="review-comment">
            Written Feedback:
          </label>
          <textarea
            id="review-comment"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`What did you like or dislike about this ${itemType.toLowerCase()}? Sound, visuals, acting, atmosphere...`}
            required
            className="bms-review-textarea"
          />
        </div>

        {successMsg && <div className="bms-review-alert-success">{successMsg}</div>}

        <button type="submit" className="bms-review-submit-btn">
          <span>Post My Review</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>

      {/* Review Feed List */}
      <div className="bms-reviews-list">
        <h4 className="bms-list-heading">
          Community Reviews ({reviews.length})
        </h4>

        {reviews.length === 0 ? (
          <div className="bms-reviews-empty">
            <div className="bms-empty-icon">💬</div>
            <p className="bms-empty-title">No reviews yet</p>
            <p className="bms-empty-sub">
              Be the first verified reviewer to share your experience!
            </p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id || rev._id || rev.createdAt} className="bms-review-card">
              <div className="bms-card-top">
                <div className="bms-user-cell">
                  {rev.userAvatar ? (
                    <img
                      src={rev.userAvatar}
                      alt={rev.userName}
                      className="bms-user-avatar-img"
                    />
                  ) : (
                    <div className="bms-user-avatar-initial">
                      {getInitial(rev.userName)}
                    </div>
                  )}
                  <div className="bms-user-meta">
                    <span className="bms-card-username">
                      {rev.userName || "Verified User"}
                      <span className="bms-verified-badge" title="Verified Customer">
                        ✓ Verified
                      </span>
                    </span>
                    {rev.userEmail && (
                      <span className="bms-card-useremail">{rev.userEmail}</span>
                    )}
                  </div>
                </div>

                <div className="bms-card-rating-block">
                  <div className="bms-card-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`bms-star-mini ${
                          s <= (Number(rev.rating) || 5) ? "filled" : "empty"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <strong className="bms-star-score">{rev.rating || 5}/5</strong>
                  </div>
                  <span className="bms-card-date">{rev.createdAt}</span>
                </div>
              </div>

              <p className="bms-card-comment">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ReviewSection;
