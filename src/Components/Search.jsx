import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMoviesApi, getEventsApi, getSportsApi, getActivitiesApi } from "../utils/api.js";
import FilterBar from "./FilterBar.jsx";
import MovieGrid from "./MovieGrid.jsx";
import "./Search.css";

function Search() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // State Management
  const [allData, setAllData] = useState({
    movies: [],
    events: [],
    sports: [],
    activities: [],
  });
  const [displayData, setDisplayData] = useState({
    movies: [],
    events: [],
    sports: [],
    activities: [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFiltered, setHasFiltered] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const [moviesData, eventsData, sportsData, activitiesData] = await Promise.all([
          getMoviesApi(),
          getEventsApi(),
          getSportsApi(),
          getActivitiesApi(),
        ]);

        const data = {
          movies: moviesData || [],
          events: eventsData || [],
          sports: sportsData || [],
          activities: activitiesData || [],
        };

        setAllData(data);
        setDisplayData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Debounced filter function
  const applyFilters = useCallback((query, languages, genres) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setIsLoading(true);

      const filtered = {
        movies: allData.movies.filter((m) => {
          const matchQuery = !query || 
            m.title?.toLowerCase().includes(query.toLowerCase()) ||
            m.description?.toLowerCase().includes(query.toLowerCase());

          const matchLanguage = languages.length === 0 || languages.includes(m.language);
          const matchGenre = genres.length === 0 || (m.genre && genres.some(g => m.genre.includes(g)));

          return matchQuery && matchLanguage && matchGenre;
        }),
        events: allData.events.filter((e) => {
          const matchQuery = !query ||
            e.title?.toLowerCase().includes(query.toLowerCase()) ||
            e.description?.toLowerCase().includes(query.toLowerCase());

          const matchLanguage = languages.length === 0 || languages.includes(e.language);
          const matchGenre = genres.length === 0 || genres.includes(e.category);

          return matchQuery && matchLanguage && matchGenre;
        }),
        sports: allData.sports.filter((s) => {
          const matchQuery = !query ||
            s.title?.toLowerCase().includes(query.toLowerCase()) ||
            s.description?.toLowerCase().includes(query.toLowerCase());

          const matchLanguage = languages.length === 0 || languages.includes(s.language);

          return matchQuery && matchLanguage;
        }),
        activities: allData.activities.filter((a) => {
          const matchQuery = !query ||
            a.title?.toLowerCase().includes(query.toLowerCase()) ||
            a.description?.toLowerCase().includes(query.toLowerCase());

          const matchLanguage = languages.length === 0 || languages.includes(a.language);
          const matchGenre = genres.length === 0 || genres.includes(a.category);

          return matchQuery && matchLanguage && matchGenre;
        }),
      };

      setDisplayData(filtered);
      setHasFiltered(query.length > 0 || languages.length > 0 || genres.length > 0);
      setIsLoading(false);
    }, 300);
  }, [allData]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    applyFilters(value, selectedLanguages, selectedGenres);
  };

  // Handle filter change
  const handleFilterChange = ({ languages, genres }) => {
    setSelectedLanguages(languages);
    setSelectedGenres(genres);
    applyFilters(searchQuery, languages, genres);
  };

  // Clear all filters and search
  const handleClearAll = () => {
    setSearchQuery("");
    setSelectedLanguages([]);
    setSelectedGenres([]);
    setDisplayData(allData);
    setHasFiltered(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="search-layout">
      {/* Top Search Header */}
      <div className="search-header">
        <div className="header-content">
          <button className="back-button" onClick={handleBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="search-input-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search Movies, Events, Sports & Activities"
              className="search-input-main"
              autoFocus
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={() => {
                  setSearchQuery("");
                  applyFilters("", selectedLanguages, selectedGenres);
                }}
              >
                ✕
              </button>
            )}
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>

          {(selectedLanguages.length > 0 || selectedGenres.length > 0 || searchQuery) && (
            <button className="clear-all-btn" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        onFilterChange={handleFilterChange}
        selectedLanguages={selectedLanguages}
        selectedGenres={selectedGenres}
      />

      {/* Three Column Layout */}
      <div className="main-content">
        {/* Left: Movies Grid - Only show if has results */}
        {displayData.movies.length > 0 && (
          <div className="left-column">
            <div className="content-header">
              <h2 className="content-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#F84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}>
                  <rect x="2" y="2" width="20" height="20" rx="2.18" />
                  <line x1="7" y1="2" x2="7" y2="22" />
                  <line x1="17" y1="2" x2="17" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                </svg>
                Movies
              </h2>
              <p className="content-count">{displayData.movies.length} results</p>
            </div>
            <MovieGrid
              items={displayData.movies}
              isLoading={isLoading}
              itemType="movie"
            />
          </div>
        )}

        {/* Center: Events Grid - Only show if has results */}
        {displayData.events.length > 0 && (
          <div className="center-column">
            <div className="content-header">
              <h2 className="content-title">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Events
              </h2>
              <p className="content-count">{displayData.events.length} results</p>
            </div>
            <MovieGrid
              items={displayData.events}
              isLoading={isLoading}
              itemType="event"
            />
          </div>
        )}

        {/* Right: Sports & Activities - Only show if has results */}
        {(displayData.sports.length > 0 || displayData.activities.length > 0) && (
          <div className="right-column">
            {displayData.sports.length > 0 && (
              <>
                <div className="content-header">
                  <h2 className="content-title">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}>
                      <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
                      <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
                      <path d="M4 22h16" />
                      <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
                    </svg>
                    Sports
                  </h2>
                  <p className="content-count">{displayData.sports.length} results</p>
                </div>
                <MovieGrid
                  items={displayData.sports}
                  isLoading={isLoading}
                  itemType="sport"
                />
              </>
            )}

            {displayData.activities.length > 0 && (
              <>
                <div className="content-header" style={{ marginTop: displayData.sports.length > 0 ? "32px" : "0" }}>
                  <h2 className="content-title">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "6px" }}>
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                    </svg>
                    Activities
                  </h2>
                  <p className="content-count">{displayData.activities.length} results</p>
                </div>
                <MovieGrid
                  items={displayData.activities}
                  isLoading={isLoading}
                  itemType="activity"
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Empty State - Only show when no results */}
      {!isLoading && Object.values(displayData).every(arr => arr.length === 0) && (
        <div className="empty-results">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h3>No data found</h3>
          <p>Try adjusting your search or filters</p>
          <button className="reset-btn" onClick={handleClearAll}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default Search;
