import { useEffect, useMemo, useState } from "react";
import MovieCard from "./MovieCard";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import "./Sports.css";
import { getStoredSports, initializeAdminData } from "../utils/adminData";
import { getSportsApi } from "../utils/api";
import { filterActiveItems, sortItemsByNewest } from "../utils/dateUtils";
import sportsData from "../data/sportsData";

function normalizeSportsMap(items, fallback = sportsData) {
  let source = items;
  if (!source || (Array.isArray(source) && source.length === 0) || (typeof source === "object" && Object.keys(source).length === 0)) {
    source = fallback;
  }

  const filtered = filterActiveItems(source);

  const result = {};
  if (Array.isArray(filtered)) {
    filtered.forEach((item) => {
      const key = item.key || item.id || item._id || item.title;
      result[key] = { ...item, key };
    });
  } else if (filtered && typeof filtered === "object") {
    Object.entries(filtered).forEach(([key, val]) => {
      const itemKey = val?.key || key;
      result[itemKey] = { ...val, key: itemKey };
    });
  }
  const sortedItems = sortItemsByNewest(
    Object.entries(result).map(([key, sport]) => ({ ...sport, __sortKey: key }))
  );
  return Object.fromEntries(
    sortedItems.map(({ __sortKey, ...sport }) => [__sortKey, sport])
  );
}

function Sports() {
  const ITEMS_PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [sportsMap, setSportsMap] = useState(() =>
    normalizeSportsMap(getStoredSports(), sportsData)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadSports = async () => {
      try {
        await initializeAdminData();
        const apiSports = await getSportsApi();
        const sportsSource = Array.isArray(apiSports)
          ? apiSports
          : apiSports?.data && Array.isArray(apiSports.data)
          ? apiSports.data
          : getStoredSports();

        if (isMounted) {
          setSportsMap(normalizeSportsMap(sportsSource, sportsData));
          setCurrentPage(1);
        }
      } catch {
        if (isMounted) {
          setSportsMap(normalizeSportsMap(getStoredSports(), sportsData));
          setCurrentPage(1);
        }
      }
    };

    loadSports();

    return () => {
      isMounted = false;
    };
  }, []);

  const sportsList = useMemo(() => {
    return Object.entries(sportsMap).map(([key, sport]) => ({
      id: `sport-${key}`,
      key: sport.key || key,
      title: sport.title,
      poster: sport.poster,
      category: sport.category || "Sport Event",
      language: sport.language || "English",
      description: sport.description || sport.desc,
      venue: sport.venue,
      date: sport.date,
      price: sport.price,
      rating: sport.rating || "9.0",
    }));
  }, [sportsMap]);

  const sportCategories = useMemo(() => {
    const set = new Set([
      "International Match",
      "League Match",
      "Exhibition Match",
      "Tournament Final",
      "Outdoor Event",
      "Golf Experience",
      "Winter Sport",
      "Beach Sport",
      "Water Sport",
      "Urban Sport",
      "Festival Sport",
      "Fitness Event",
    ]);
    sportsList.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [sportsList]);

  const sportLanguages = useMemo(() => {
    const set = new Set(["English", "Hindi", "Gujarati", "Marathi"]);
    sportsList.forEach(s => {
      if (s.language) {
        s.language.split(",").forEach(l => set.add(l.trim()));
      }
    });
    return Array.from(set);
  }, [sportsList]);

  const filteredSports = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return sportsList.filter((item) => {
      const matchQuery =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
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
            (item.category && item.category.toLowerCase().includes(cat)) ||
            (item.title && item.title.toLowerCase().includes(cat))
          );
        });
      
      return matchQuery && matchLanguage && matchCategory;
    });
  }, [search, sportsList, selectedLanguages, selectedGenres]);

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

  const totalPages = Math.ceil(filteredSports.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedSports = filteredSports.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="sports-page">
      <div className="sports-page-container">
        {/* Single Line Filter & Search Bar with White Background */}
        <div className="page-header-single-line">
          <h2 className="header-title">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "8px" }}>
              <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
              <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
              <path d="M4 22h16" />
              <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
            </svg>
            Popular Sports ({sportsList.length})
          </h2>
          
          <div className="header-filters">
            <FilterBar
              onFilterChange={handleFilterChange}
              selectedLanguages={selectedLanguages}
              selectedGenres={selectedGenres}
              languages={sportLanguages}
              genres={sportCategories}
              languageLabel="Language"
              genreLabel="Sport Type"
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
                placeholder="Search sports..." 
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

        <div className="sports-grid">
          {filteredSports.length > 0 ? (
            paginatedSports.map((sport) => (
              <MovieCard
                key={sport.id}
                id={sport.id}
                type="sport"
                title={sport.title}
                poster={sport.poster}
                price={sport.price}
                rating={sport.rating || "8.5"}
                item={sport}
              />
            ))
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>No sports found matching your filters</p>
              <button type="button" className="reset-btn" onClick={handleClearAll}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
        {filteredSports.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredSports.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="sports"
            showPageSize={false}
          />
        )}
      </div>
    </div>
  );
}

export default Sports;
