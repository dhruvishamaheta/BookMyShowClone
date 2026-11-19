import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { SearchOverlayContext } from "../context/SearchOverlayContext.jsx";
import "./SearchOverlayResults.css";

function slugify(value) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SearchOverlayResults({ results, loading, hasSearched }) {
  const navigate = useNavigate();
  const { closeSearchOverlay } = useContext(SearchOverlayContext);

  if (!hasSearched && results.length === 0) {
    return (
      <div className="search-results-empty">
        <p>Start typing to search for movies, events, and more</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="search-results-loading">
        <div className="loading-spinner"></div>
        <p>Searching...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="search-results-empty">
        <p>No results found. Try a different search term.</p>
      </div>
    );
  }

  const handleItemClick = (item) => {
    const rawId = item.id || slugify(item.title);
    const encodedId = encodeURIComponent(rawId);
    let path = `/showtimes/${encodedId}`;
    if (item.type === "event") {
      path = `/events/${encodedId}`;
    } else if (item.type === "activity") {
      path = `/activity/${encodedId}`;
    } else if (item.type === "sport") {
      path = `/sports/${encodedId}`;
    }
    if (closeSearchOverlay) closeSearchOverlay();
    navigate(path);
  };

  const getButtonLabel = (type) => {
    if (type === "event") return "Book Pass";
    if (type === "activity") return "Book Slot";
    if (type === "sport") return "Book Ticket";
    return "Book Tickets";
  };

  return (
    <div className="search-results-container">
      <div className="search-results-grid">
        {results.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="search-result-card"
            onClick={() => handleItemClick(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleItemClick(item);
            }}
          >
            <div className="search-result-image">
              <img src={item.poster} alt={item.title} loading="lazy" />
              <div className="search-result-overlay">
                <button
                  type="button"
                  className="search-result-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleItemClick(item);
                  }}
                >
                  {getButtonLabel(item.type)}
                </button>
              </div>
            </div>
            <div className="search-result-info">
              <h4 className="search-result-title">{item.title}</h4>
              <p className="search-result-meta">{item.meta}</p>
              {item.language && <p className="search-result-language">{item.language}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchOverlayResults;
