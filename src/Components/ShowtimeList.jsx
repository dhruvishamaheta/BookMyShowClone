import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStoredMovies } from "../utils/adminData";
import { getSelectedCity, saveSelectedCity } from "../utils/userStorage";
import { getCinemasForCity } from "../data/cityCinemasData";
import { getCinemasApi } from "../utils/api";
import { generateValidBookingDates, isItemActive, resolveItemDates, formatDisplayDate } from "../utils/dateUtils";
import moviesData from "../data/moviesData";
import CitySelectionModal from "./CitySelectionModal";
import "./ShowtimeList.css";

function slugify(value) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ShowtimeList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const normalizedId = slugify(id);

  // 1. Reactive Selected City State
  const [selectedCity, setSelectedCity] = useState(() => getSelectedCity() || "Mumbai");
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [apiTheatres, setApiTheatres] = useState([]);

  // Sync city when user changes city anywhere in the app (Navbar or Modal)
  useEffect(() => {
    const handleCitySync = (e) => {
      const updatedCity = e?.detail || getSelectedCity() || "Mumbai";
      setSelectedCity(updatedCity);
    };

    window.addEventListener("cityUpdated", handleCitySync);
    window.addEventListener("storage", handleCitySync);

    return () => {
      window.removeEventListener("cityUpdated", handleCitySync);
      window.removeEventListener("storage", handleCitySync);
    };
  }, []);

  // Fetch or retrieve theatres for selectedCity
  useEffect(() => {
    let isMounted = true;
    getCinemasApi(selectedCity)
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setApiTheatres(data);
        }
      })
      .catch(() => {
        // Fallback to local curated city cinemas dataset
        if (isMounted) {
          setApiTheatres([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  // Find movie
  const allStored = getStoredMovies() || [];
  const movie =
    allStored.find((item) => item.id === id || item._id === id) ||
    moviesData.find((item) => item.id === id) ||
    allStored.find((item) => slugify(item.id) === normalizedId) ||
    moviesData.find((item) => slugify(item.id) === normalizedId) ||
    allStored.find((item) => slugify(item.title) === normalizedId) ||
    moviesData.find((item) => slugify(item.title) === normalizedId);

  // Strictly get theatres for the selected city (guaranteeing 6-7 cinemas for the current city)
  const cityTheatres = useMemo(() => {
    if (apiTheatres && apiTheatres.length > 0) {
      return apiTheatres;
    }
    return getCinemasForCity(selectedCity);
  }, [apiTheatres, selectedCity]);

  const upcomingDates = useMemo(() => generateValidBookingDates(movie, 7), [movie]);
  const active = isItemActive(movie);

  // Filter theatres by amenities/experience
  const filteredTheatres = useMemo(() => {
    if (activeFilter === "all") return cityTheatres;
    return cityTheatres.filter((theatre) => {
      const facs = (theatre.facilities || []).map((f) => f.toLowerCase());
      if (activeFilter === "dolby") {
        return facs.some((f) => f.includes("dolby") || f.includes("atmos"));
      }
      if (activeFilter === "imax") {
        return facs.some((f) => f.includes("imax") || f.includes("3d") || f.includes("4dx"));
      }
      if (activeFilter === "recliner") {
        return facs.some((f) => f.includes("recliner") || f.includes("luxe") || f.includes("vip"));
      }
      if (activeFilter === "food") {
        return facs.some((f) => f.includes("food") || f.includes("dining") || f.includes("cafe") || f.includes("menu"));
      }
      if (activeFilter === "mticket") {
        return facs.some((f) => f.includes("m-ticket") || f.includes("ticket"));
      }
      return true;
    });
  }, [cityTheatres, activeFilter]);

  const handleCitySelectFromModal = (city) => {
    setSelectedCity(city);
    saveSelectedCity(city);
    setCityModalOpen(false);
  };

  const handleTimeClick = (theatre, time) => {
    const selectedDateStr = upcomingDates[selectedDateIndex]?.fullDate || upcomingDates[0]?.fullDate;
    navigate(`/seats/${encodeURIComponent(id || movie?.id || normalizedId)}/${encodeURIComponent(time)}`, {
      state: {
        theatre: theatre.name,
        city: selectedCity,
        theatreDetails: theatre,
        selectedDate: selectedDateStr,
        movie: {
          id: movie?.id || id,
          title: movie?.title || id.replace(/-/g, " "),
          poster: movie?.poster || "",
          theatre: theatre.name,
          city: selectedCity,
          showtime: time,
          genre: movie?.genre || "Drama",
          language: movie?.language || "Hindi",
        },
      },
    });
  };

  if (!movie) {
    return (
      <div className="showtime-page empty-state">
        <h2>Movie not found!</h2>
        <p>We couldn't find showtimes for this title.</p>
        <button onClick={() => navigate("/")}>Go Back Home</button>
      </div>
    );
  }

  if (!active) {
    const { endDate } = resolveItemDates(movie);
    return (
      <div className="showtime-page empty-state" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎬</div>
        <h2 style={{ fontSize: "24px", color: "#111827", marginBottom: "8px" }}>Theatrical Run Completed</h2>
        <p style={{ fontSize: "15px", color: "#6b7280", maxWidth: "500px", margin: "0 auto 24px" }}>
          Ticket booking for <strong>{movie.title}</strong> has ended (ended on {formatDisplayDate(endDate)}). Please check other movies currently running in theatres.
        </p>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => navigate("/movies")}
          style={{ padding: "12px 28px", borderRadius: "8px", cursor: "pointer", background: "linear-gradient(135deg, #f84464 0%, #e11d48 100%)", color: "#fff", border: "none", fontWeight: "600" }}
        >
          Browse Running Movies
        </button>
      </div>
    );
  }

  return (
    <div className="showtime-page">
      {/* 1. Hero Movie Summary Banner */}
      <div className="showtime-hero-banner">
        <div className="showtime-hero-container">
          <div className="showtime-hero-left">
            <span className="showtime-kicker">NOW SHOWING IN CINEMAS</span>
            <h1 className="showtime-movie-title">{movie.title}</h1>
            <div className="showtime-tags-row">
              <span className="showtime-pill lang-pill">{movie.language || "Hindi"}</span>
              <span className="showtime-pill format-pill">
                {movie.title?.toLowerCase().includes("spider") ? "3D" : (movie.format || "2D")}
              </span>
              <span className="showtime-pill genre-pill">{movie.genre || "Action, Drama"}</span>
              <span className="showtime-pill duration-pill">{movie.duration || "2h 15m"}</span>
              {movie.rating && (
                <span className="showtime-pill rating-pill">
                  ⭐ {typeof movie.rating === "number" ? movie.rating.toFixed(1) : movie.rating}/10
                </span>
              )}
            </div>
            <p className="showtime-movie-desc">
              {movie.description || "Select your preferred cinema theatre and showtime to choose seats."}
            </p>
          </div>

          <div className="showtime-hero-poster-wrap">
            {movie.poster ? (
              <img src={movie.poster} alt={movie.title} className="showtime-hero-poster" />
            ) : (
              <div className="showtime-poster-placeholder">🎬</div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sticky Booking Filter Bar (Date Selector + City Selector) */}
      <div className="showtime-controls-strip">
        <div className="showtime-controls-container">
          {/* Date Selector Pills */}
          <div className="showtime-dates-list" role="tablist" aria-label="Showtime Dates">
            {upcomingDates.map((dateObj, idx) => (
              <button
                key={dateObj.fullDate}
                type="button"
                className={`showtime-date-btn ${selectedDateIndex === idx ? "active" : ""}`}
                onClick={() => setSelectedDateIndex(idx)}
              >
                <span className="date-day">{dateObj.label}</span>
                <span className="date-number">{dateObj.dateNumber}</span>
                <span className="date-month">{dateObj.month}</span>
              </button>
            ))}
          </div>

          {/* City Location Indicator with Change Button */}
          <div className="showtime-city-badge-wrap">
            <div className="showtime-city-info">
              <span className="city-label">Selected City:</span>
              <strong className="city-current-name">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#F84464" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {selectedCity}
              </strong>
            </div>
            <button
              type="button"
              className="showtime-change-city-btn"
              onClick={() => setCityModalOpen(true)}
              title={`Switch from ${selectedCity} to another city`}
            >
              Change City
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Filter Tags & Theatres List */}
      <main className="showtime-main-wrapper">
        <div className="showtime-header-row">
          <div className="showtime-header-title-box">
            <h2 className="showtime-section-heading">
              Cinemas in <span className="highlight-city">{selectedCity}</span>
            </h2>
            <p className="showtime-count-text">
              Showing <strong>{filteredTheatres.length}</strong> cinema theatres with available showtimes
            </p>
          </div>

          {/* Quick Experience Filter Chips */}
          <div className="showtime-filter-chips" role="tablist" aria-label="Filter Cinemas">
            <button
              type="button"
              className={`filter-chip ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All Cinemas ({cityTheatres.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${activeFilter === "dolby" ? "active" : ""}`}
              onClick={() => setActiveFilter("dolby")}
            >
              4K Dolby Atmos
            </button>
            <button
              type="button"
              className={`filter-chip ${activeFilter === "imax" ? "active" : ""}`}
              onClick={() => setActiveFilter("imax")}
            >
              IMAX / 3D
            </button>
            <button
              type="button"
              className={`filter-chip ${activeFilter === "recliner" ? "active" : ""}`}
              onClick={() => setActiveFilter("recliner")}
            >
              Recliner / VIP
            </button>
            <button
              type="button"
              className={`filter-chip ${activeFilter === "food" ? "active" : ""}`}
              onClick={() => setActiveFilter("food")}
            >
              Food & Beverage
            </button>
          </div>
        </div>

        {/* 4. Theatres List */}
        <div className="showtime-theatres-list">
          {filteredTheatres.length > 0 ? (
            filteredTheatres.map((theatre, index) => (
              <div key={theatre.name || index} className="theatre-card" id={`theatre-${index}`}>
                <div className="theatre-header">
                  <div className="theatre-info-col">
                    <div className="theatre-name-row">
                      <span className="theatre-heart-icon">❤️</span>
                      <h3 className="theatre-name">{theatre.name}</h3>
                    </div>

                    {theatre.address && (
                      <p className="theatre-address">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {theatre.address}
                      </p>
                    )}

                    {/* Facilities / Amenities Tags */}
                    <div className="theatre-amenities-row">
                      {(theatre.facilities || ["4K Dolby Atmos", "M-Ticket Available", "Recliner"]).map((fac) => (
                        <span key={fac} className="amenity-tag">
                          {fac}
                        </span>
                      ))}
                      <span className="cancellation-badge">
                        ✓ Cancellation Available
                      </span>
                    </div>
                  </div>

                  <div className="theatre-screens-badge">
                    <span className="screens-count">{theatre.screens || 4} Screens</span>
                    <span className="sound-type">Dolby Atmos</span>
                  </div>
                </div>

                {/* Showtimes Buttons Grid */}
                <div className="theatre-timings-grid">
                  {(theatre.times || theatre.showtimes || ["10:00 AM", "01:15 PM", "04:30 PM", "07:45 PM", "10:30 PM"]).map((time) => (
                    <button
                      key={time}
                      type="button"
                      className="showtime-btn"
                      onClick={() => handleTimeClick(theatre, time)}
                      title={`Book tickets for ${time} at ${theatre.name}`}
                    >
                      <span className="time-text">{time}</span>
                      <span className="screen-tag">4K LASER</span>
                      <span className="price-hint">
                        ₹{theatre.pricing?.silver ?? 180} - ₹{theatre.pricing?.platinum ?? 450}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="showtime-empty-card">
              <div className="empty-icon">📍</div>
              <h3>No cinemas found matching your filter in {selectedCity}</h3>
              <p>Try switching to "All Cinemas" or select another nearby city.</p>
              <button type="button" className="reset-filter-btn" onClick={() => setActiveFilter("all")}>
                View All Cinemas in {selectedCity}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* City Selection Modal */}
      {cityModalOpen && (
        <CitySelectionModal
          currentCity={selectedCity}
          onSelect={handleCitySelectFromModal}
          onClose={() => setCityModalOpen(false)}
        />
      )}
    </div>
  );
}

export default ShowtimeList;
