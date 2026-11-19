import MovieCard from "./MovieCard";
import "./MovieGrid.css";

function MovieGrid({ items, isLoading, itemType = "movie", onItemClick }) {
  if (isLoading) {
    return (
      <div className="movie-grid-container">
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-poster"></div>
              <div className="skeleton-title"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="movie-grid-container">
        <div className="empty-state">
          <svg className="empty-icon-svg" viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p className="empty-message">No {itemType}s found</p>
          <p className="empty-subtext">Try adjusting your filters or search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-grid-container">
      <div className="movie-grid">
        {items.map((item) => (
          <MovieCard
            key={item.id || item._id}
            id={item.id || item._id}
            type={itemType}
            title={item.title}
            poster={item.poster}
            rating={item.rating}
            price={item.price}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}

export default MovieGrid;
