import MovieCard from "./MovieCard";
import "./Search.css";

function SearchResults({ results, query, navigate }) {
  const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr ? arr.length : 0), 0);

  if (totalResults === 0) {
    return (
      <div className="no-results">
        <div className="no-results-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h3>No results found for &quot;{query}&quot;</h3>
        <p>Try searching with different keywords like movie title, genre, or city venue</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <h2>Search Results for &quot;{query}&quot;</h2>
        <p className="results-count">Found {totalResults} result{totalResults !== 1 ? "s" : ""}</p>
      </div>

      {/* Movies Results */}
      {results.movies && results.movies.length > 0 && (
        <div className="results-section">
          <h3 className="results-section-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#F84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "8px" }}>
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
            Movies ({results.movies.length})
          </h3>
          <div className="results-grid">
            {results.movies.map((movie) => (
              <MovieCard
                key={movie.id || movie._id}
                id={movie.id || movie._id}
                type="movie"
                title={movie.title}
                poster={movie.poster}
                rating={movie.rating}
                item={movie}
              />
            ))}
          </div>
        </div>
      )}

      {/* Events Results */}
      {results.events && results.events.length > 0 && (
        <div className="results-section">
          <h3 className="results-section-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "8px" }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Live Events ({results.events.length})
          </h3>
          <div className="results-grid">
            {results.events.map((event) => (
              <MovieCard
                key={event.id || event._id}
                id={event.id || event._id}
                type="event"
                title={event.title}
                poster={event.poster}
                rating={event.rating}
                price={event.price}
                item={event}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sports Results */}
      {results.sports && results.sports.length > 0 && (
        <div className="results-section">
          <h3 className="results-section-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "8px" }}>
              <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
              <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
              <path d="M4 22h16" />
              <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
            </svg>
            Sports Matches ({results.sports.length})
          </h3>
          <div className="results-grid">
            {results.sports.map((sport) => (
              <MovieCard
                key={sport.id || sport._id}
                id={sport.id || sport._id}
                type="sport"
                title={sport.title}
                poster={sport.poster}
                rating={sport.rating || "8.5"}
                price={sport.price}
                item={sport}
              />
            ))}
          </div>
        </div>
      )}

      {/* Activities Results */}
      {results.activities && results.activities.length > 0 && (
        <div className="results-section">
          <h3 className="results-section-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "8px" }}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Activities & Workshops ({results.activities.length})
          </h3>
          <div className="results-grid">
            {results.activities.map((activity) => (
              <MovieCard
                key={activity.id || activity._id}
                id={activity.id || activity._id}
                type="activity"
                title={activity.title}
                poster={activity.poster}
                price={activity.price}
                rating={activity.rating || "8.5"}
                item={activity}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
