import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredMovies, saveMovies } from "../../utils/adminData";
import { isAdminAuthenticated } from "../../utils/adminAuth";
import { paginateItems, sortAdminItems } from "../../utils/adminListUtils";
import { uploadImageToCloudinary } from "../../utils/cloudinaryUpload";
import { getItemDateStatus, getTodayYMD, getOffsetDateYMD, resolveItemDates } from "../../utils/dateUtils";
import AdminModal from "./AdminModal";
import "./AdminStyles.css";

const GENRE_OPTIONS = [
  "Action",
  "Drama",
  "Comedy",
  "Thriller",
  "Action, Thriller",
  "Action, Drama",
  "Romance",
  "Romantic Comedy",
  "Sci-Fi",
  "Horror",
  "Adventure",
  "Animation",
  "Crime",
  "Mystery",
  "Fantasy",
  "Family",
  "Historical",
];

const LANGUAGE_OPTIONS = [
  "Hindi",
  "English",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Marathi",
  "Kannada",
  "Punjabi",
  "Bengali",
  "Multi-Language",
];

const FORMAT_OPTIONS = [
  "2D",
  "3D",
  "2D, 3D",
];

const emptyForm = {
  title: "",
  poster: "",
  rating: "8.5",
  duration: "2h 30m",
  genre: "Action",
  language: "Hindi",
  format: "2D",
  description: "",
  releaseDate: getTodayYMD(),
  startDate: getTodayYMD(),
  endDate: "2026-12-30",
  showtimesText: "PVR Cinemas | 10:00 AM, 01:30 PM, 06:00 PM, 09:30 PM\nINOX: City Mall | 11:30 AM, 03:00 PM, 08:00 PM",
};

function createMovieId(title) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || `movie-${Date.now()}`
  );
}

function formatShowtimes(showtimes) {
  if (!showtimes || !Array.isArray(showtimes) || showtimes.length === 0) {
    return "PVR Cinemas | 10:00 AM, 01:30 PM, 06:00 PM";
  }
  return showtimes
    .map((theatre) => `${theatre.name || "Theatre"} | ${(theatre.times || []).join(", ")}`)
    .join("\n");
}

function parseShowtimes(showtimesText) {
  return showtimesText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, timesPart] = line.split("|").map((part) => part.trim());
      return {
        name: namePart || "PVR Multiplex",
        times: timesPart
          ? timesPart.split(",").map((time) => time.trim()).filter(Boolean)
          : ["10:00 AM", "02:00 PM", "06:00 PM"],
      };
    })
    .filter((theatre) => theatre.name);
}

function AdminMovies() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState(() => getStoredMovies());
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
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

  const genres = useMemo(
    () => ["All", ...new Set(movies.map((m) => m.genre).filter(Boolean))],
    [movies]
  );
  const languages = useMemo(
    () => ["All", ...new Set(movies.map((m) => m.language).filter(Boolean))],
    [movies]
  );

  const filteredMovies = useMemo(() => {
    const query = search.trim().toLowerCase();
    const base = movies.filter((movie) => {
      const matchesQuery =
        !query ||
        [movie.title, movie.genre, movie.language, movie.description]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesGenre = genreFilter === "All" || movie.genre?.includes(genreFilter);
      const matchesLanguage =
        languageFilter === "All" || movie.language?.includes(languageFilter);
      
      const statusObj = getItemDateStatus(movie);
      const matchesStatus = statusFilter === "All" || statusObj.status === statusFilter;

      return matchesQuery && matchesGenre && matchesLanguage && matchesStatus;
    });
    return sortAdminItems(base, sortBy);
  }, [genreFilter, languageFilter, statusFilter, movies, search, sortBy]);

  const pagedMovies = useMemo(
    () => paginateItems(filteredMovies, page, pageSize),
    [filteredMovies, page, pageSize]
  );

  const openCreate = () => {
    setEditingId("");
    setForm(emptyForm);
    setFormErrors({});
    setShowEditor(true);
  };

  const openEdit = (movie) => {
    setEditingId(movie.id);
    setFormErrors({});
    const { startDate, endDate } = resolveItemDates(movie);
    setForm({
      title: movie.title || "",
      poster: movie.poster || "",
      rating: movie.rating?.toString?.() || "8.0",
      duration: movie.duration || "2h 30m",
      genre: movie.genre || "Action",
      language: movie.language || "Hindi",
      format: movie.format || "2D",
      description: movie.description || "",
      releaseDate: movie.releaseDate || startDate,
      startDate: movie.startDate || startDate,
      endDate: movie.endDate || endDate,
      showtimesText: formatShowtimes(movie.showtimes),
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
      errors.title = "Movie title is required.";
    } else if (form.title.trim().length < 2) {
      errors.title = "Title must be at least 2 characters.";
    }

    if (!form.poster.trim()) {
      errors.poster = "Poster image URL or asset path is required.";
    }

    const numRating = Number(form.rating);
    if (form.rating === "" || isNaN(numRating) || numRating < 0 || numRating > 10) {
      errors.rating = "Rating must be a number between 0.0 and 10.0.";
    }

    if (!form.duration.trim()) {
      errors.duration = "Duration is required (e.g., 2h 30m).";
    }

    if (!form.genre.trim()) {
      errors.genre = "Type is required.";
    }

    if (!form.language.trim()) {
      errors.language = "Language is required.";
    }

    if (!form.description.trim()) {
      errors.description = "Description is required.";
    } else if (form.description.trim().length < 10) {
      errors.description = "Description should be at least 10 characters.";
    }

    if (!form.startDate) {
      errors.startDate = "Show start date is required.";
    }

    if (!form.endDate) {
      errors.endDate = "Show end date is required.";
    } else if (form.startDate && form.endDate < form.startDate) {
      errors.endDate = "End date must be on or after start date.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const title = form.title.trim();
    const rating = Number(form.rating) || 8.0;

    const nextMovie = {
      id: editingId || createMovieId(title),
      title,
      poster: form.poster.trim(),
      rating,
      duration: form.duration.trim(),
      genre: form.genre.trim(),
      language: form.language.trim(),
      format: form.format?.trim?.() || "2D",
      description: form.description.trim(),
      releaseDate: form.releaseDate?.trim?.() || form.startDate,
      startDate: form.startDate,
      endDate: form.endDate,
      createdAt: editingId
        ? movies.find((movie) => movie.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      showtimes: parseShowtimes(form.showtimesText),
    };

    const updated = editingId
      ? movies.map((m) => (m.id === editingId ? nextMovie : m))
      : [nextMovie, ...movies];

    setMovies(updated);
    saveMovies(updated);
    closeEditor();
    setToast(editingId ? `Movie "${title}" updated successfully.` : `Movie "${title}" created successfully.`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = movies.filter((movie) => movie.id !== deleteTarget.id);
    setMovies(updated);
    saveMovies(updated);
    if (editingId === deleteTarget.id) closeEditor();
    const deletedTitle = deleteTarget.title;
    setDeleteTarget(null);
    setToast(`Movie "${deletedTitle}" deleted successfully.`);
  };

  return (
    <div>
      {/* Header Card */}
      <div className="admin-card">
        <div className="admin-card-header admin-card-header-centered">
          <div className="admin-card-title-group admin-card-title-group-centered">
            <h2>Movie Management</h2>
            <p>Add, edit, or remove movies, set start/end showing dates, and customize theatre showtimes.</p>
          </div>
          <div className="admin-header-actions">
            <button className="admin-btn admin-btn-primary" onClick={openCreate}>
              <span>+ Create Movie</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Sorters */}
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
              placeholder="Search movies by title, type, language..."
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
              <option value="active">Active (Now Showing)</option>
              <option value="upcoming">Upcoming</option>
              <option value="expired">Expired / Ended</option>
            </select>

            <select
              className="admin-select"
              value={genreFilter}
              onChange={(e) => {
                setGenreFilter(e.target.value);
                setPage(1);
              }}
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g === "All" ? "All Types" : g}
                </option>
              ))}
            </select>

            <select
              className="admin-select"
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value);
                setPage(1);
              }}
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l === "All" ? "All Languages" : l}
                </option>
              ))}
            </select>

            <select
              className="admin-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="alphabetical">Title (A-Z)</option>
              <option value="rating">Rating (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Content Table View Only */}
        {filteredMovies.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No Movies Found</h3>
            <p>Try adjusting your search query or filters, or add a new movie.</p>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate}>
              + Add Movie
            </button>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Movie Details</th>
                  <th>Type & Language</th>
                  <th>Show Dates (Start - End)</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Theatres</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedMovies.items.map((movie) => {
                  const statusObj = getItemDateStatus(movie);
                  return (
                    <tr key={movie.id}>
                      <td>
                        <div className="admin-item-cell">
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="admin-table-thumb"
                            onError={(e) => {
                              e.target.src = "https://placehold.co/100x140?text=Poster";
                            }}
                          />
                          <div className="admin-item-cell-info">
                            <strong>{movie.title}</strong>
                            <small>{movie.duration} • {movie.format || "2D"}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-red" style={{ marginRight: "4px" }}>
                          {movie.genre}
                        </span>
                        <small style={{ display: "block", color: "var(--admin-text-muted)", marginTop: "4px" }}>
                          {movie.language}
                        </small>
                      </td>
                      <td>
                        <div className="admin-dates-cell">
                          <div className="admin-dates-range">
                            <span>📅 {statusObj.startDateFormatted}</span>
                            <span>→</span>
                            <span>{statusObj.endDateFormatted}</span>
                          </div>
                          <span className="admin-dates-hint">
                            {statusObj.status === "expired" ? "Ended (Hidden from user side)" : "Bookable on user side"}
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
                        <span className="admin-badge admin-badge-yellow">★ {movie.rating}</span>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-gray">
                          {movie.showtimes?.length || 0} Theatres
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="admin-actions-group" style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => openEdit(movie)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => setDeleteTarget(movie)}
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
        {filteredMovies.length > 0 && (
          <div className="admin-pagination">
            <div className="admin-pagination-info">
              Showing <strong>{pagedMovies.startIndex}</strong> to <strong>{pagedMovies.endIndex}</strong> of{" "}
              <strong>{pagedMovies.totalItems}</strong> movies
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
              {Array.from({ length: pagedMovies.totalPages }, (_, i) => i + 1).map((num) => (
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
                onClick={() => setPage((c) => Math.min(pagedMovies.totalPages, c + 1))}
                disabled={page === pagedMovies.totalPages}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Movie Create / Edit Modal with Validation */}
      {showEditor && (
        <AdminModal
          title={editingId ? "Edit Movie Details" : "Create New Movie"}
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
                {editingId ? "Save Movie Changes" : "Create & Publish Movie"}
              </button>
            </>
          }
        >
          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Movie Title <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.title ? "has-error" : ""}`}
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (formErrors.title) setFormErrors({ ...formErrors, title: "" });
                  }}
                  placeholder="e.g. Inception, KGF Chapter 2"
                />
                {formErrors.title && <span className="admin-field-error">{formErrors.title}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Duration <span className="admin-required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`admin-input ${formErrors.duration ? "has-error" : ""}`}
                  value={form.duration}
                  onChange={(e) => {
                    setForm({ ...form, duration: e.target.value });
                    if (formErrors.duration) setFormErrors({ ...formErrors, duration: "" });
                  }}
                  placeholder="e.g. 2h 45m"
                />
                {formErrors.duration && (
                  <span className="admin-field-error">{formErrors.duration}</span>
                )}
              </div>
            </div>

            {/* Start Date & End Date Row */}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Show Start Date <span className="admin-required-star">*</span>
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
                  Tickets become bookable on this date.
                </small>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Show End Date <span className="admin-required-star">*</span>
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
                  After this date, movie is automatically hidden from users.
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
                  placeholder="e.g. https://res.cloudinary.com/... or /src/assets/poster.png"
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
                        setToast("Uploading poster to Cloudinary...");
                        const cdnUrl = await uploadImageToCloudinary(file, "bookmyshow/movies");
                        setForm((prev) => ({ ...prev, poster: cdnUrl }));
                        if (formErrors.poster) setFormErrors((prev) => ({ ...prev, poster: "" }));
                        setToast("Poster uploaded to Cloudinary successfully!");
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
                    alt="Poster Preview"
                    className="admin-poster-preview-img"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/80x100?text=Invalid";
                    }}
                  />
                  <div className="admin-poster-preview-text">
                    <span>✓ Image Preview Detected</span>
                    <small style={{ display: "block", color: "var(--admin-text-muted)" }}>
                      {form.poster.includes("cloudinary.com") ? "☁️ Hosted on Cloudinary CDN" : "Image loads properly for movie cards & details."}
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  Movie Type <span className="admin-required-star">*</span>
                </label>
                <select
                  className={`admin-input ${formErrors.genre ? "has-error" : ""}`}
                  value={form.genre}
                  onChange={(e) => {
                    setForm({ ...form, genre: e.target.value });
                    if (formErrors.genre) setFormErrors({ ...formErrors, genre: "" });
                  }}
                >
                  <option value="">Select Type</option>
                  {GENRE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {formErrors.genre && <span className="admin-field-error">{formErrors.genre}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Language <span className="admin-required-star">*</span>
                </label>
                <select
                  className={`admin-input ${formErrors.language ? "has-error" : ""}`}
                  value={form.language}
                  onChange={(e) => {
                    setForm({ ...form, language: e.target.value });
                    if (formErrors.language) setFormErrors({ ...formErrors, language: "" });
                  }}
                >
                  <option value="">Select Language</option>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
                {formErrors.language && <span className="admin-field-error">{formErrors.language}</span>}
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Format (2D, 3D, etc.)</label>
                <select
                  className="admin-input"
                  value={form.format || "2D"}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                >
                  {FORMAT_OPTIONS.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {fmt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-label">
                  IMDb / User Rating (0.0 - 10.0) <span className="admin-required-star">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className={`admin-input ${formErrors.rating ? "has-error" : ""}`}
                  value={form.rating}
                  onChange={(e) => {
                    setForm({ ...form, rating: e.target.value });
                    if (formErrors.rating) setFormErrors({ ...formErrors, rating: "" });
                  }}
                  placeholder="8.5"
                />
                {formErrors.rating && <span className="admin-field-error">{formErrors.rating}</span>}
              </div>
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-label">
                Movie Synopsis / Description <span className="admin-required-star">*</span>
              </label>
              <textarea
                rows="3"
                className={`admin-textarea ${formErrors.description ? "has-error" : ""}`}
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: "" });
                }}
                placeholder="Write a brief storyline or synopsis for the movie listing..."
              />
              {formErrors.description && (
                <span className="admin-field-error">{formErrors.description}</span>
              )}
            </div>

            <div className="admin-form-group full-width">
              <label className="admin-label">
                Theatres & Showtimes (One theatre per line)
              </label>
              <textarea
                rows="3"
                className="admin-textarea"
                value={form.showtimesText}
                onChange={(e) => setForm({ ...form, showtimesText: e.target.value })}
                placeholder="PVR Cinemas | 10:00 AM, 01:30 PM, 06:00 PM&#10;INOX: City Mall | 11:30 AM, 03:00 PM"
              />
            </div>
          </form>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <AdminModal
          title="Confirm Movie Deletion"
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
                Yes, Delete Movie
              </button>
            </>
          }
        >
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: "15px", color: "var(--admin-text-main)", marginBottom: "10px" }}>
              Are you sure you want to permanently delete:
            </p>
            <strong style={{ fontSize: "17px", color: "var(--admin-red-primary)" }}>
              {deleteTarget.title}
            </strong>
            <p style={{ fontSize: "13px", color: "var(--admin-text-muted)", marginTop: "10px" }}>
              This will remove the movie and its associated showtimes.
            </p>
          </div>
        </AdminModal>
      )}

      {/* Toast */}
      {toast && <div className="admin-toast">✓ {toast}</div>}
    </div>
  );
}

export default AdminMovies;
