import { useEffect, useMemo, useState } from "react";
import MovieCard from "./MovieCard";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import "./Events.css";
import { getStoredEvents, initializeAdminData } from "../utils/adminData";
import { getEventsApi } from "../utils/api";
import { sortItemsByNewest } from "../utils/dateUtils";
import eventsData from "../data/eventsData";

function normalizeEventsList(items, fallback = eventsData) {
  const source = Array.isArray(items) && items.length > 0 ? items : fallback;
  return sortItemsByNewest(source.map((item) => ({
    ...item,
    id: item.id || item._id,
  })));
}

function Events() {
  const ITEMS_PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [eventsList, setEventsList] = useState(() =>
    normalizeEventsList(getStoredEvents(), eventsData)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        await initializeAdminData();
        const apiEvents = await getEventsApi();
        const eventsSource = Array.isArray(apiEvents)
          ? apiEvents
          : apiEvents?.data && Array.isArray(apiEvents.data)
          ? apiEvents.data
          : getStoredEvents();

        if (isMounted) {
          setEventsList(normalizeEventsList(eventsSource, eventsData));
          setCurrentPage(1);
        }
      } catch {
        if (isMounted) {
          setEventsList(normalizeEventsList(getStoredEvents(), eventsData));
          setCurrentPage(1);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const eventCategories = useMemo(() => {
    const set = new Set([
      "Music Concert",
      "Comedy Show",
      "Music Night",
      "Live Music",
      "Workshop",
      "Festival",
      "Auditorium",
      "Outdoor",
      "Cafe",
      "Laser Show",
      "Dance Festival",
      "Magic Show",
      "DJ Night",
      "Opera",
      "Expo & Fair"
    ]);
    eventsList.forEach(e => {
      if (e.type) set.add(e.type);
      if (e.category) set.add(e.category.charAt(0).toUpperCase() + e.category.slice(1));
    });
    return Array.from(set);
  }, [eventsList]);

  const eventLanguages = useMemo(() => {
    const set = new Set(["English", "Hindi", "Gujarati", "Marathi", "Tamil", "Telugu", "Urdu"]);
    eventsList.forEach(e => {
      if (e.language) {
        e.language.split(",").forEach(l => set.add(l.trim()));
      }
    });
    return Array.from(set);
  }, [eventsList]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return eventsList.filter((item) => {
      const matchQuery =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.type && item.type.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.venue && item.venue.toLowerCase().includes(q));

      const matchLanguage =
        selectedLanguages.length === 0 ||
        (item.language && selectedLanguages.some(l => item.language.toLowerCase().includes(l.toLowerCase())));

      const matchCategory =
        selectedGenres.length === 0 ||
        selectedGenres.some(g => {
          const cat = g.toLowerCase();
          return (
            (item.type && item.type.toLowerCase().includes(cat)) ||
            (item.category && item.category.toLowerCase().includes(cat)) ||
            (item.title && item.title.toLowerCase().includes(cat))
          );
        });
      
      return matchQuery && matchLanguage && matchCategory;
    });
  }, [search, eventsList, selectedLanguages, selectedGenres]);

  const handleFilterChange = ({ languages, genres }) => {
    setSelectedLanguages(languages || []);
    setSelectedGenres(genres || []);
    setCurrentPage(1);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleClearAll = () => {
    setSearch("");
    setSelectedLanguages([]);
    setSelectedGenres([]);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedEvents = filteredEvents.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="events-page">
      <div className="events-page-container">
        {/* Single Line Filter & Search Bar with White Background */}
        <div className="page-header-single-line">
          <h2 className="header-title">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "8px" }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Events ({eventsList.length})
          </h2>
          
          <div className="header-filters">
            <FilterBar
              onFilterChange={handleFilterChange}
              selectedLanguages={selectedLanguages}
              selectedGenres={selectedGenres}
              languages={eventLanguages}
              genres={eventCategories}
              languageLabel="Language"
              genreLabel="Category"
            />
          </div>

          <div className="header-search">
            <div className="search-input-box">
              <svg className="search-box-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input 
                type="text"
                value={search} 
                onChange={handleSearchChange}
                placeholder="Search events, comedy, music..." 
                className="search-input" 
              />
              {search && (
                <button type="button" className="search-clear-btn" onClick={() => { setSearch(""); setCurrentPage(1); }} aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>
            {(search || selectedLanguages.length > 0 || selectedGenres.length > 0) && (
              <button type="button" className="clear-all-btn" onClick={handleClearAll}>
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="events-grid">
          {filteredEvents.length > 0 ? (
            paginatedEvents.map((event) => (
              <MovieCard
                key={event.id}
                id={event.id}
                type="event"
                title={event.title}
                poster={event.poster}
                rating={event.rating}
                price={event.price}
                item={event}
              />
            ))
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>No events found matching your filters</p>
              <button type="button" className="reset-btn" onClick={handleClearAll}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
        {filteredEvents.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredEvents.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="events"
            showPageSize={false}
          />
        )}
      </div>
    </div>
  );
}

export default Events;
