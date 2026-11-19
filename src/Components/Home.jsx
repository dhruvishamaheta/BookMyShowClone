import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Banner from "./Banner";
import "./Home.css";
import moviesData from "../data/moviesData";
import {
  homeCategories,
  bestLiveEvents,
  musicStudioEvents,
  outdoorEvents,
  laughterTherapyEvents,
  popularEvents,
  latestPlays,
  sportsEvents,
  funActivities,
} from "../data/homeSectionsData";
import { renderCategoryIcon } from "./CategoryIcons";
import {
  getStoredActivities,
  getStoredEvents,
  getStoredMovies,
  getStoredSports,
} from "../utils/adminData";
import { filterActiveItems, sortItemsByNewest } from "../utils/dateUtils";

function getNewestCreatedItem(items) {
  return sortItemsByNewest(items).find((item) => item?.createdAt);
}

function toHomeCardItem(item, type) {
  const id = item.id || item._id || item.key;
  const path = type === "event"
    ? `/events/${id}`
    : type === "sport"
    ? `/sports/${item.key || id}`
    : `/activity/${id}`;

  return {
    ...item,
    id,
    poster: item.poster,
    location: item.location || item.venue,
    description: item.description || item.desc,
    badge: item.createdAt ? "NEW" : item.badge || "",
    date: item.date,
    price: item.price,
    buttonText: type === "sport" ? "Book Ticket" : "Book Pass",
    path,
  };
}

function getEventRail(events, predicate, preferredIds = []) {
  const matches = sortItemsByNewest(events.filter(predicate));
  const newlyAdded = matches.filter((item) => item.createdAt);
  const preferred = preferredIds
    .map((id) => matches.find((item) => (item.id || item._id) === id))
    .filter(Boolean);
  const rest = matches.filter(
    (item) => !newlyAdded.includes(item) && !preferred.includes(item)
  );

  return [...newlyAdded, ...preferred, ...rest]
    .filter((item, index, list) => (
      list.findIndex((candidate) => (candidate.id || candidate._id) === (item.id || item._id)) === index
    ))
    .slice(0, 5)
    .map((item) => toHomeCardItem(item, "event"));
}

function Home() {
  const navigate = useNavigate();
  const [selectedMovieFilter, setSelectedMovieFilter] = useState("all");
  const [moviesList, setMoviesList] = useState(() => {
    const stored = getStoredMovies();
    return sortItemsByNewest(filterActiveItems(stored && stored.length > 0 ? stored : moviesData));
  });
  const [eventsList, setEventsList] = useState(() => getStoredEvents());
  const [sportsList, setSportsList] = useState(() => Object.values(filterActiveItems(getStoredSports()) || {}));
  const [activitiesList, setActivitiesList] = useState(() => filterActiveItems(getStoredActivities()));

  useEffect(() => {
    const refreshCatalog = () => {
      const stored = getStoredMovies();
      if (stored && stored.length > 0) {
        setMoviesList(sortItemsByNewest(filterActiveItems(stored)));
      } else {
        setMoviesList(sortItemsByNewest(filterActiveItems(moviesData)));
      }
      setEventsList(getStoredEvents());
      setSportsList(Object.values(filterActiveItems(getStoredSports()) || {}));
      setActivitiesList(filterActiveItems(getStoredActivities()));
    };
    const refreshTimer = window.setTimeout(refreshCatalog, 0);
    return () => window.clearTimeout(refreshTimer);
  }, []);

  const homeBestLiveEvents = useMemo(() => {
    const rail = getEventRail(
      eventsList,
      (event) => {
        const text = `${event.type || ""} ${event.category || ""} ${event.title || ""}`.toLowerCase();
        return (
          text.includes("music concert") ||
          text.includes("night concert") ||
          text.includes("live concert") ||
          text.includes("live performance")
        );
      },
      ["event1", "event15", "event12"]
    );
    return rail.length > 0 ? rail : bestLiveEvents.slice(0, 5);
  }, [eventsList]);

  const homeMusicStudioEvents = useMemo(() => {
    const rail = getEventRail(
      eventsList,
      (event) => {
        const text = `${event.type || ""} ${event.category || ""} ${event.title || ""}`.toLowerCase();
        return (
          text.includes("music") ||
          text.includes("acoustic") ||
          text.includes("concert") ||
          text.includes("opera") ||
          text.includes("live")
        ) && !text.includes("comedy");
      },
      ["event4", "event3", "event1"]
    );
    return rail.length > 0 ? rail : musicStudioEvents.slice(0, 5);
  }, [eventsList]);

  const homeLaughterEvents = useMemo(() => {
    const rail = getEventRail(
      eventsList,
      (event) => {
        const text = `${event.type || ""} ${event.category || ""} ${event.title || ""}`.toLowerCase();
        return (
          text.includes("comedy") ||
          text.includes("stand-up") ||
          text.includes("standup")
        );
      },
      ["event2", "event5", "event6"]
    );
    return rail.length > 0 ? rail : laughterTherapyEvents.slice(0, 5);
  }, [eventsList]);

  const homeSportsEvents = useMemo(() => {
    const newest = getNewestCreatedItem(sportsList);
    if (!newest) return sportsEvents.slice(0, 5);
    const newestCard = toHomeCardItem(newest, "sport");
    return [
      newestCard,
      ...sportsEvents.filter((item) => item.id !== newestCard.id),
    ].slice(0, 5);
  }, [sportsList]);

  const homeFunActivities = useMemo(() => {
    const newest = getNewestCreatedItem(activitiesList);
    if (!newest) return funActivities.slice(0, 5);
    const newestCard = toHomeCardItem(newest, "activity");
    return [
      newestCard,
      ...funActivities.filter((item) => item.id !== newestCard.id),
    ].slice(0, 5);
  }, [activitiesList]);

  // Filtered movies based on user selection
  const filteredMovies = useMemo(() => {
    if (selectedMovieFilter === "all") return moviesList.slice(0, 10);
    if (selectedMovieFilter === "gujarati") {
      return moviesList.filter((m) => (m.language || "").toLowerCase().includes("gujarati")).slice(0, 10);
    }
    if (selectedMovieFilter === "hindi") {
      return moviesList.filter((m) => (m.language || "").toLowerCase().includes("hindi")).slice(0, 10);
    }
    if (selectedMovieFilter === "action") {
      return moviesList.filter((m) => (m.genre || "").toLowerCase().includes("action")).slice(0, 10);
    }
    if (selectedMovieFilter === "drama") {
      return moviesList.filter((m) => (m.genre || "").toLowerCase().includes("drama") || (m.genre || "").toLowerCase().includes("romance")).slice(0, 10);
    }
    return moviesList.slice(0, 10);
  }, [moviesList, selectedMovieFilter]);

  return (
    <div className="home-container">
      {/* 1. Hero Carousel Banner */}
      <Banner />

      {/* 2. Quick Category Exploration Strip (Matching Screenshot) */}
      <nav className="home-category-strip" aria-label="Explore Categories">
        <div className="home-category-container">
          {homeCategories.map((cat) => (
            <Link key={cat.id} to={cat.path} className="home-category-pill" id={`cat-pill-${cat.id}`}>
              <div className="home-category-icon-wrapper">
                {renderCategoryIcon(cat.iconType, "home-category-svg")}
              </div>
              <div className="home-category-meta">
                <span className="home-category-label">{cat.label}</span>
                <span className="home-category-count">{cat.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Sections Wrapper */}
      <main className="home-content-wrapper">
        
        {/* SECTION 1: Recommended Movies */}
        <section className="home-section" id="recommended-movies">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <div className="home-tag-row">
                <span className="home-section-tag movie-tag">CINEMA</span>
                <span className="home-section-live-dot" />
              </div>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#F84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="2" y1="7" x2="7" y2="7" />
                  <line x1="2" y1="17" x2="7" y2="17" />
                  <line x1="17" y1="17" x2="22" y2="17" />
                  <line x1="17" y1="7" x2="22" y2="7" />
                </svg>
                Recommended Movies
              </h2>
              <p className="home-section-subtitle">Discover blockbuster hits, trending regional cinema and new releases</p>
            </div>
            <Link to="/movies" className="home-see-all-btn">
              <span>See All Movies</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          {/* Quick Filter Chips */}
          <div className="home-movie-filter-pills" role="tablist" aria-label="Filter movies">
            <button
              type="button"
              className={`filter-pill-btn ${selectedMovieFilter === "all" ? "active" : ""}`}
              onClick={() => setSelectedMovieFilter("all")}
            >
              All Releases
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${selectedMovieFilter === "gujarati" ? "active" : ""}`}
              onClick={() => setSelectedMovieFilter("gujarati")}
            >
              Gujarati
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${selectedMovieFilter === "hindi" ? "active" : ""}`}
              onClick={() => setSelectedMovieFilter("hindi")}
            >
              Hindi
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${selectedMovieFilter === "action" ? "active" : ""}`}
              onClick={() => setSelectedMovieFilter("action")}
            >
              Action & Thriller
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${selectedMovieFilter === "drama" ? "active" : ""}`}
              onClick={() => setSelectedMovieFilter("drama")}
            >
              Drama & Romance
            </button>
          </div>

          {/* Cards Grid: Only Name & Location, Button "Book Tickets" */}
          <div className="home-card-grid">
            {filteredMovies.slice(0, 5).map((movie) => (
              <div
                key={movie.id}
                className="home-card movie-home-card"
                onClick={() => navigate(`/showtimes/${movie.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/showtimes/${movie.id}`);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="home-card-poster"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60";
                    }}
                  />
                  <div className="home-card-rating-badge">
                    <svg className="home-star-icon" viewBox="0 0 24 24" fill="#F59E0B" width="12" height="12">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <strong>{movie.rating || "8.0"}</strong>/10
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/showtimes/${movie.id}`);
                      }}
                    >
                      Book Tickets
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{movie.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn movie-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/showtimes/${movie.id}`);
                      }}
                    >
                      Book Tickets
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PROMO BANNER 1: Stream & Endless Entertainment */}
        <section className="home-section">
          <div className="home-stream-promo-banner">
            <div className="stream-promo-left">
              <span className="stream-promo-badge">BOOKMYSHOW STREAM</span>
              <h3 className="stream-promo-title">Premiere Of The Week</h3>
              <p className="stream-promo-desc">
                Handpicked cinema directly to your screen. Rent or buy new movies every Friday without subscriptions.
              </p>
              <div className="stream-promo-features">
                <span className="stream-feature-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Instant Access
                </span>
                <span className="stream-bullet">•</span>
                <span className="stream-feature-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                  4K Ultra HD
                </span>
                <span className="stream-bullet">•</span>
                <span className="stream-feature-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#F84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                  Dolby 5.1
                </span>
              </div>
            </div>
            <div className="stream-promo-right">
              <button
                type="button"
                className="stream-promo-btn"
                onClick={() => navigate("/movies")}
              >
                <span>Explore Premieres</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 2: Best Live Events */}
        <section className="home-section" id="best-live-events">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <span className="home-section-tag live-tag">LIVE PASSES</span>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Best Live Events
              </h2>
              <p className="home-section-subtitle">Must-attend mega fests, grand concert nights and live cultural gatherings</p>
            </div>
            <Link to="/events" className="home-see-all-btn">
              <span>View All Events</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="home-card-grid live-events-grid">
            {homeBestLiveEvents.map((item) => (
              <div
                key={item.id}
                className="home-card live-event-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(item.path);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="home-card-poster"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="home-card-badge-pill hot-badge">{item.badge}</span>
                  )}
                  <div className="home-card-price-overlay">
                    ₹{item.price} onwards
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{item.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn live-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: Your Music Studio */}
        <section className="home-section highlight-bg-section" id="music-studio">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <span className="home-section-tag music-tag">CONCERTS & GIGS</span>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
                Your Music Studio
              </h2>
              <p className="home-section-subtitle">Stadium concerts, soulful acoustic nights, indie gigs and music festivals</p>
            </div>
            <Link to="/events?type=music" className="home-see-all-btn">
              <span>Explore Music Shows</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="home-card-grid">
            {homeMusicStudioEvents.map((item) => (
              <div
                key={item.id}
                className="home-card music-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(item.path);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="home-card-poster"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="home-card-badge-pill music-badge">{item.badge}</span>
                  )}
                  <div className="home-card-price-overlay">
                    ₹{item.price} onwards
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{item.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn music-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Outdoor Events */}
        <section className="home-section" id="outdoor-events">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <span className="home-section-tag outdoor-tag">OPEN AIR & NATURE</span>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M8 18l4-8 4 8" />
                  <path d="M3 21h18" />
                  <path d="M12 3v5" />
                  <path d="M10 8h4" />
                </svg>
                Outdoor Events
              </h2>
              <p className="home-section-subtitle">Guided jungle treks, coastal festivals, city cycling and open-air retreats</p>
            </div>
            <Link to="/activity" className="home-see-all-btn">
              <span>View All Outdoor</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="home-card-grid">
            {outdoorEvents.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="home-card outdoor-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(item.path);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="home-card-poster"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="home-card-badge-pill outdoor-badge">{item.badge}</span>
                  )}
                  <div className="home-card-price-overlay">
                    ₹{item.price} onwards
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{item.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn outdoor-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: Laughter Therapy */}
        <section className="home-section comedy-bg-section" id="laughter-therapy">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <span className="home-section-tag comedy-tag">STANDUP COMEDY</span>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
                Laughter Therapy
              </h2>
              <p className="home-section-subtitle">Catch India&apos;s funniest comedians, open mic specials and unscripted roasts</p>
            </div>
            <Link to="/events?type=comedy" className="home-see-all-btn">
              <span>View Comedy Shows</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="home-card-grid comedy-grid">
            {homeLaughterEvents.map((item) => (
              <div
                key={item.id}
                className="home-card comedy-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(item.path);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="home-card-poster"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="home-card-badge-pill comedy-badge">{item.badge}</span>
                  )}
                  <div className="home-card-price-overlay">
                    ₹{item.price} onwards
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Ticket
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{item.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn comedy-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Ticket
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: Popular Events */}
        <section className="home-section" id="popular-events">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <span className="home-section-tag popular-tag">TRENDING</span>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
                </svg>
                Popular Events
              </h2>
              <p className="home-section-subtitle">Top curated auditorium events, immersive exhibitions and festive gatherings</p>
            </div>
            <Link to="/events" className="home-see-all-btn">
              <span>See All Events</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="home-card-grid">
            {popularEvents.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="home-card popular-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(item.path);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="home-card-poster"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="home-card-badge-pill popular-badge">{item.badge}</span>
                  )}
                  <div className="home-card-price-overlay">
                    ₹{item.price} onwards
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{item.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn popular-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 7: Latest Plays */}
        <section className="home-section plays-bg-section" id="latest-plays">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <span className="home-section-tag plays-tag">THEATRE & DRAMA</span>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
                Latest Plays
              </h2>
              <p className="home-section-subtitle">Powerful stage adaptations, classical opera, musicals and legendary drama</p>
            </div>
            <Link to="/events?type=theater" className="home-see-all-btn">
              <span>View All Plays</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="home-card-grid">
            {latestPlays.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="home-card play-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(item.path);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="home-card-poster"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="home-card-badge-pill play-badge">{item.badge}</span>
                  )}
                  <div className="home-card-price-overlay">
                    ₹{item.price} onwards
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{item.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn play-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Pass
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 8: Sports Events */}
        <section className="home-section" id="sports-events">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <span className="home-section-tag sports-tag">MATCHES & TOURNAMENTS</span>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                  <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
                </svg>
                Sports Events
              </h2>
              <p className="home-section-subtitle">Cheer in cricket championships, football derbies, badminton and tennis finals</p>
            </div>
            <Link to="/sports" className="home-see-all-btn">
              <span>See All Sports</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="home-card-grid">
            {homeSportsEvents.map((item) => (
              <div
                key={item.id}
                className="home-card sport-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(item.path);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="home-card-poster"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="home-card-badge-pill sport-badge">{item.badge}</span>
                  )}
                  <div className="home-card-price-overlay">
                    ₹{item.price} onwards
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Ticket
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{item.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn sport-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Ticket
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 9: Explore Fun Activities */}
        <section className="home-section activities-bg-section" id="explore-activities">
          <div className="home-section-header">
            <div className="home-section-title-wrap">
              <span className="home-section-tag activity-tag">THEME PARKS & FUN</span>
              <h2 className="home-section-title">
                <svg className="home-title-icon" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                </svg>
                Explore Fun Activities
              </h2>
              <p className="home-section-subtitle">Snow parks, laser tag battles, waterparks and immersive escape room games</p>
            </div>
            <Link to="/activity" className="home-see-all-btn">
              <span>View All Activities</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>

          <div className="home-card-grid">
            {homeFunActivities.map((item) => (
              <div
                key={item.id}
                className="home-card activity-card"
                onClick={() => navigate(item.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(item.path);
                }}
              >
                <div className="home-card-poster-wrap">
                  <img
                    src={item.poster}
                    alt={item.title}
                    className="home-card-poster"
                    loading="lazy"
                  />
                  {item.badge && (
                    <span className="home-card-badge-pill activity-badge">{item.badge}</span>
                  )}
                  <div className="home-card-price-overlay">
                    ₹{item.price} onwards
                  </div>
                  <div className="home-card-overlay">
                    <button
                      type="button"
                      className="home-quick-book-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Slot
                    </button>
                  </div>
                </div>

                <div className="home-card-body">
                  <h3 className="home-card-title">{item.title}</h3>
                  <div className="home-card-footer">
                    <button
                      type="button"
                      className="home-card-action-btn activity-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Book Slot
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 10: Special Perks & Offers Banner */}
        <section className="home-section">
          <div className="home-perks-banner">
            <div className="perks-icon-badge">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <div className="perks-content">
              <h4 className="perks-title">Exclusive Bank Offers & Cashback Deals</h4>
              <p className="perks-subtitle">Get up to 50% discount with ICICI, HDFC, Axis and SBI cards on movie tickets, passes & events.</p>
            </div>
            <button
              type="button"
              className="perks-explore-btn"
              onClick={() => navigate("/offers")}
            >
              Explore All Offers
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

export default Home;
