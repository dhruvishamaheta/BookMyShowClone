import { useNavigate } from "react-router-dom";
import "./MovieCard.css";

function slugify(value) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function MovieCard({
  id,
  title,
  poster,
  type = "movie",
  rating,
  price,
  item = {},
}) {
  const navigate = useNavigate();
  const rawId = id || item.id || item._id || slugify(title);
  const encodedId = encodeURIComponent(rawId);
  const cardTitle = title || item.title || "Untitled";
  const cardPoster =
    poster ||
    item.poster ||
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60";
  const cardRating = rating || item.rating || "8.0";
  const cardPrice = price || item.price;

  // Determine path & button label by category
  let path = `/showtimes/${encodedId}`;
  let buttonLabel = "Book Tickets";

  if (type === "event") {
    path = `/events/${encodedId}`;
    buttonLabel = "Book Pass";
  } else if (type === "activity") {
    path = `/activity/${encodedId}`;
    buttonLabel = "Book Pass";
  } else if (type === "sport") {
    path = `/sports/${encodedId}`;
    buttonLabel = "Book Ticket";
  } else {
    path = `/showtimes/${encodedId}`;
    buttonLabel = "Book Tickets";
  }

  const handleCardClick = () => {
    navigate(path);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    navigate(path);
  };

  return (
    <div
      className="universal-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleCardClick();
      }}
    >
      <div className="universal-card-poster-wrap">
        <img
          src={cardPoster}
          alt={cardTitle}
          className="universal-card-poster"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60";
          }}
        />

        {/* Rating Badge or Price Badge */}
        {cardPrice ? (
          <div className="universal-card-price-overlay">
            ₹{cardPrice} onwards
          </div>
        ) : (
          <div className="universal-card-rating-badge">
            <svg
              className="universal-star-icon"
              viewBox="0 0 24 24"
              fill="#F59E0B"
              width="12"
              height="12"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <strong>
              {typeof cardRating === "number"
                ? cardRating.toFixed(1)
                : cardRating}
            </strong>
            /10
          </div>
        )}

        {/* Quick action overlay on hover */}
        <div className="universal-card-overlay">
          <button
            type="button"
            className="universal-quick-btn"
            onClick={handleButtonClick}
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      <div className="universal-card-body">
        <h3 className="universal-card-title">{cardTitle}</h3>
        <div className="universal-card-footer">
          <button
            type="button"
            className="universal-card-action-btn"
            onClick={handleButtonClick}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MovieCard;
