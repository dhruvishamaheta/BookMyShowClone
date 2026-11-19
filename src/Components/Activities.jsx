import { useEffect, useMemo, useState } from "react";
import MovieCard from "./MovieCard";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import "./Events.css";
import { getStoredActivities, initializeAdminData } from "../utils/adminData";
import { getActivitiesApi } from "../utils/api";
import { filterActiveItems, sortItemsByNewest } from "../utils/dateUtils";
import activityData from "../data/activityData";

function normalizeActivitiesList(items, fallback = activityData) {
  const source = Array.isArray(items) && items.length > 0 ? items : fallback;
  const activeOnly = filterActiveItems(source);
  return sortItemsByNewest((activeOnly || []).map((item) => ({
    ...item,
    id: item.id || item._id,
  })));
}

function Activities() {
  const ITEMS_PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [activitiesList, setActivitiesList] = useState(() =>
    normalizeActivitiesList(getStoredActivities(), activityData)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      try {
        await initializeAdminData();
        const activities = await getActivitiesApi();
        const rawList = Array.isArray(activities)
          ? activities
          : activities?.data && Array.isArray(activities.data)
          ? activities.data
          : getStoredActivities();
        
        if (isMounted) {
          setActivitiesList(normalizeActivitiesList(rawList, activityData));
          setCurrentPage(1);
        }
      } catch {
        if (isMounted) {
          setActivitiesList(normalizeActivitiesList(getStoredActivities(), activityData));
          setCurrentPage(1);
        }
      }
    }

    loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  const activityCategories = useMemo(() => {
    const set = new Set([
      "Adventure",
      "Experience",
      "Fitness",
      "Gaming & Escape",
      "Dance & Music",
      "Water Sports",
      "Laser Tag",
      "Art & Craft",
    ]);
    activitiesList.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [activitiesList]);

  const activityLanguages = useMemo(() => {
    const set = new Set(["English", "Hindi", "Gujarati"]);
    activitiesList.forEach(a => {
      if (a.language) {
        a.language.split(",").forEach(l => set.add(l.trim()));
      }
    });
    return Array.from(set);
  }, [activitiesList]);

  const filteredActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return activitiesList.filter((item) => {
      const matchQuery =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      const matchLanguage =
        selectedLanguages.length === 0 ||
        (item.language && selectedLanguages.some(l => item.language.toLowerCase().includes(l.toLowerCase())));

      const matchCategory =
        selectedGenres.length === 0 ||
        selectedGenres.some(g => {
          const cat = g.toLowerCase();
          return (
            (item.category && item.category.toLowerCase().includes(cat)) ||
            (item.title && item.title.toLowerCase().includes(cat)) ||
            (item.description && item.description.toLowerCase().includes(cat))
          );
        });
      
      return matchQuery && matchLanguage && matchCategory;
    });
  }, [search, activitiesList, selectedLanguages, selectedGenres]);

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

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedActivities = filteredActivities.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="events-page">
      <div className="events-page-container">
        {/* Single Line Filter & Search Bar with White Background */}
        <div className="page-header-single-line">
          <h2 className="header-title">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "8px" }}>
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Trending Activities ({activitiesList.length})
          </h2>
          
          <div className="header-filters">
            <FilterBar
              onFilterChange={handleFilterChange}
              selectedLanguages={selectedLanguages}
              selectedGenres={selectedGenres}
              languages={activityLanguages}
              genres={activityCategories}
              languageLabel="Language"
              genreLabel="Activity Type"
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
                placeholder="Search activities, workshops..." 
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
          {filteredActivities.length > 0 ? (
            paginatedActivities.map((activity) => (
              <MovieCard
                key={activity.id}
                id={activity.id}
                type="activity"
                title={activity.title}
                poster={activity.poster}
                price={activity.price}
                rating={activity.rating || "8.5"}
                item={activity}
              />
            ))
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>No activities found matching your filters</p>
              <button type="button" className="reset-btn" onClick={handleClearAll}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
        {filteredActivities.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredActivities.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="activities"
            showPageSize={false}
          />
        )}
      </div>
    </div>
  );
}

export default Activities;
