import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import moviesData from "../data/moviesData";
import { getStoredMovies, initializeAdminData } from "../utils/adminData";
import ReviewSection from "./ReviewSection";
import "./MovieDetails.css";

function slugify(value) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findMovieByIdOrSlug(id) {
  const normalizedId = slugify(id);
  const allMovies = getStoredMovies();
  const exactMatch = allMovies.find((m) => m.id === id) || moviesData.find((m) => m.id === id);
  if (exactMatch) return exactMatch;
  return (
    allMovies.find((movie) => slugify(movie.id) === normalizedId) ||
    moviesData.find((movie) => slugify(movie.id) === normalizedId) ||
    allMovies.find((movie) => slugify(movie.title) === normalizedId) ||
    moviesData.find((movie) => slugify(movie.title) === normalizedId)
  );
}

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(() => findMovieByIdOrSlug(id));

  useEffect(() => {
    initializeAdminData().finally(() => {
      setMovie(findMovieByIdOrSlug(id));
    });
  }, [id]);

  if (!movie) {
    return <div className="movie-details-empty">Movie not found</div>;
  }

  return (
    <div className="movie-details-page">
      <div className="movie-details-card">
        <div className="poster-panel">
          <img src={movie.poster} alt={movie.title} className="poster-img" />
        </div>

        <div className="movie-details-right">
          <div className="movie-details-main">
            <p className="section-kicker">Now Showing</p>
            <h2 className="movie-title">{movie.title}</h2>
            <p className="movie-meta">
              {movie.language} • {movie.title?.toLowerCase().includes("spider") ? "3D" : (movie.format || "2D")} • {movie.duration}
            </p>

            <div className="detail-grid">
              <div className="detail-box">
                <span className="detail-label">Rating</span>
                <strong>{movie.rating}/10</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Format</span>
                <strong>{movie.title?.toLowerCase().includes("spider") ? "3D" : (movie.format || "2D")}</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Type</span>
                <strong>{movie.genre}</strong>
              </div>
              <div className="detail-box">
                <span className="detail-label">Release</span>
                <strong>{movie.releaseDate || "TBA"}</strong>
              </div>
            </div>

            <p className="movie-desc">{movie.description}</p>
          </div>

          <div className="movie-action-panel">
            <div className="booking-box">
              <button
                className="book-btn"
                onClick={() => navigate(`/showtimes/${encodeURIComponent(movie.id)}`)}
              >
                Book Tickets
              </button>
              <p className="booking-copy">Select from theatres and seat choices on the next page.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <ReviewSection
        itemId={movie.id}
        itemType="Movie"
        itemTitle={movie.title}
      />
    </div>
  );
}

export default MovieDetails;
