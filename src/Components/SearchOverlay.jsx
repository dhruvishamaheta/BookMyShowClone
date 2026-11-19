import { useContext, useState, useCallback, useRef, useEffect } from "react";
import { SearchOverlayContext } from "../context/SearchOverlayContext.jsx";
import SearchTabs from "./SearchTabs.jsx";
import SearchOverlayResults from "./SearchOverlayResults.jsx";
import { getMoviesApi, getEventsApi, getSportsApi, getActivitiesApi } from "../utils/api.js";
import { filterActiveItems } from "../utils/dateUtils.js";
import "./SearchOverlay.css";

function SearchOverlay() {
  const { isSearchOverlayOpen, closeSearchOverlay } = useContext(SearchOverlayContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [allData, setAllData] = useState({ movies: [], events: [], sports: [], activities: [] });
  const debounceTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [moviesData, eventsData, sportsData, activitiesData] = await Promise.all([
          getMoviesApi(),
          getEventsApi(),
          getSportsApi(),
          getActivitiesApi(),
        ]);

        setAllData({
          movies: filterActiveItems(moviesData || []),
          events: eventsData || [],
          sports: filterActiveItems(sportsData || []),
          activities: filterActiveItems(activitiesData || []),
        });
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchAllData();
  }, []);

  // Focus search input when overlay opens
  useEffect(() => {
    if (isSearchOverlayOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOverlayOpen]);

  // Handle search with debounce
  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      setHasSearched(query.length > 0);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (query.length === 0) {
          setResults([]);
          return;
        }

        setLoading(true);

        const filteredResults = [];

        if (activeTab === "All" || activeTab === "Movies") {
          allData.movies.forEach((movie) => {
            if (
              movie.title?.toLowerCase().includes(query.toLowerCase()) ||
              movie.description?.toLowerCase().includes(query.toLowerCase())
            ) {
              filteredResults.push({
                id: movie.id,
                type: "movie",
                title: movie.title,
                poster: movie.poster,
                meta: movie.format || "Movie",
                language: movie.language,
              });
            }
          });
        }

        if (activeTab === "All" || activeTab === "Events" || activeTab === "Plays") {
          allData.events.forEach((event) => {
            if (
              event.title?.toLowerCase().includes(query.toLowerCase()) ||
              event.description?.toLowerCase().includes(query.toLowerCase())
            ) {
              filteredResults.push({
                id: event.id,
                type: "event",
                title: event.title,
                poster: event.poster,
                meta: event.category || "Event",
                language: event.language,
              });
            }
          });
        }

        if (activeTab === "All" || activeTab === "Sports") {
          allData.sports.forEach((sport) => {
            if (
              sport.title?.toLowerCase().includes(query.toLowerCase()) ||
              sport.description?.toLowerCase().includes(query.toLowerCase())
            ) {
              filteredResults.push({
                id: sport.id,
                type: "sport",
                title: sport.title,
                poster: sport.poster,
                meta: sport.category || "Sports",
                language: sport.language,
              });
            }
          });
        }

        if (activeTab === "All" || activeTab === "Stream") {
          allData.activities.forEach((activity) => {
            if (
              activity.title?.toLowerCase().includes(query.toLowerCase()) ||
              activity.description?.toLowerCase().includes(query.toLowerCase())
            ) {
              filteredResults.push({
                id: activity.id,
                type: "activity",
                title: activity.title,
                poster: activity.poster,
                meta: activity.category || "Activity",
              });
            }
          });
        }

        setResults(filteredResults.slice(0, 20));
        setLoading(false);
      }, 300);
    },
    [activeTab, allData]
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Refresh search results with new tab filter
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
    closeSearchOverlay();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!isSearchOverlayOpen) return null;

  return (
    <div className="search-overlay" onKeyDown={handleKeyDown}>
      <div className="search-overlay-backdrop" onClick={handleClose}></div>
      
      <div className="search-overlay-content">
        <div className="search-overlay-header">
          <div className="search-overlay-input-wrapper">
            <svg
              className="search-overlay-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Movies, Events, Sports & Activities"
              className="search-overlay-input"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button className="search-overlay-close" onClick={handleClose} aria-label="Close search">
            ✕
          </button>
        </div>

        <div className="search-overlay-body">
          <SearchTabs activeTab={activeTab} onTabChange={handleTabChange} />
          <SearchOverlayResults results={results} loading={loading} hasSearched={hasSearched} />
        </div>
      </div>
    </div>
  );
}

export default SearchOverlay;
