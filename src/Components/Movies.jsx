import { useEffect, useMemo, useState } from "react";
import MovieCard from "./MovieCard";
import FilterBar from "./FilterBar";
import Pagination from "./Pagination";
import "./Movies.css";
import { getStoredMovies, initializeAdminData } from "../utils/adminData";
import { getMoviesApi } from "../utils/api";
import { filterActiveItems, sortItemsByNewest } from "../utils/dateUtils";
import moviesData from "../data/moviesData";

function normalizeMoviesList(items, fallback = moviesData) {
  const source = Array.isArray(items) && items.length > 0 ? items : fallback;
  const activeOnly = filterActiveItems(source);
  return sortItemsByNewest((activeOnly || []).map((movie) => {
    const isSpider = movie.title?.toLowerCase().includes("spider") || movie.id === "spider-man";
    return {
      ...movie,
      id: movie.id || movie._id,
      format: isSpider ? "3D" : (movie.format || "2D"),
    };
  }));
}

function Movies() {
  const ITEMS_PER_PAGE = 10;
  const [search, setSearch] = useState("");
  const [movieList, setMovieList] = useState(() =>
    normalizeMoviesList(getStoredMovies(), moviesData)
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedFormats, setSelectedFormats] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadMovies = async () => {
      try {
        await initializeAdminData();
        const apiMovies = await getMoviesApi();
        const moviesSource = Array.isArray(apiMovies)
          ? apiMovies
          : apiMovies?.data && Array.isArray(apiMovies.data)
          ? apiMovies.data
          : getStoredMovies();

        if (isMounted) {
          setMovieList(normalizeMoviesList(moviesSource, moviesData));
          setCurrentPage(1);
        }
      } catch {
        if (isMounted) {
          setMovieList(normalizeMoviesList(getStoredMovies(), moviesData));
          setCurrentPage(1);
        }
      }
    };

    loadMovies();

    return () => {
      isMounted = false;
    };
  }, []);

  const movieLanguages = useMemo(() => {
    const langs = new Set(["Hindi", "English", "Gujarati", "Tamil", "Telugu", "Marathi", "Punjabi"]);
    movieList.forEach(m => {
      if (m.language) {
        m.language.split(",").forEach(l => langs.add(l.trim()));
      }
    });
    return Array.from(langs);
  }, [movieList]);

  const movieGenres = useMemo(() => {
    const set = new Set(["Action", "Comedy", "Drama", "Romance", "Thriller", "Horror", "Adventure", "Sci-Fi", "Mythology"]);
    movieList.forEach(m => {
      if (m.genre) {
        m.genre.split(",").forEach(g => set.add(g.trim()));
      }
    });
    return Array.from(set);
  }, [movieList]);

  const movieFormats = useMemo(() => {
    const set = new Set(["2D", "3D"]);
    movieList.forEach(m => {
      const isSpider = m.title?.toLowerCase().includes("spider") || m.id === "spider-man";
      const fmt = isSpider ? "3D" : (m.format || "2D");
      fmt.split(",").forEach(f => {
        const trimmed = f.trim();
        if (trimmed === "2D" || trimmed === "3D") set.add(trimmed);
      });
    });
    return Array.from(set);
  }, [movieList]);

  const filteredMovies = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return movieList.filter((item) => {
      const isSpider = item.title?.toLowerCase().includes("spider") || item.id === "spider-man";
      const itemFormat = isSpider ? "3D" : (item.format || "2D");

      const matchQuery =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.genre && item.genre.toLowerCase().includes(q)) ||
        (item.language && item.language.toLowerCase().includes(q)) ||
        (itemFormat && itemFormat.toLowerCase().includes(q));

      const matchLanguage =
        selectedLanguages.length === 0 ||
        (item.language && selectedLanguages.some(l => item.language.toLowerCase().includes(l.toLowerCase())));

      const matchGenre =
        selectedGenres.length === 0 ||
        selectedGenres.some(g => item.genre && item.genre.toLowerCase().includes(g.toLowerCase()));

      const matchFormat =
        selectedFormats.length === 0 ||
        selectedFormats.some(f => 
          itemFormat.toLowerCase().split(",").map(part => part.trim()).includes(f.toLowerCase()) ||
          itemFormat.toLowerCase().includes(f.toLowerCase())
        );
      
      return matchQuery && matchLanguage && matchGenre && matchFormat;
    });
  }, [search, movieList, selectedLanguages, selectedGenres, selectedFormats]);

  const handleFilterChange = ({ languages, genres, formats = [] }) => {
    setSelectedLanguages(languages || []);
    setSelectedGenres(genres || []);
    setSelectedFormats(formats || []);
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
    setSelectedFormats([]);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedMovies = filteredMovies.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="movies-page">
      <div className="movies-page-container">
        {/* Single Line Filter & Search Bar with White Background */}
        <div className="page-header-single-line">
          <h2 className="header-title">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#F84464" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "8px" }}>
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            All Movies ({movieList.length})
          </h2>
          
          <div className="header-filters">
            <FilterBar
              onFilterChange={handleFilterChange}
              selectedLanguages={selectedLanguages}
              selectedGenres={selectedGenres}
              selectedFormats={selectedFormats}
              languages={movieLanguages}
              genres={movieGenres}
              formats={movieFormats}
              showLanguages={true}
              showGenres={true}
              showFormats={true}
              languageLabel="Language"
              genreLabel="Genre"
              formatLabel="Format"
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
                placeholder="Search movies..." 
                className="search-input" 
              />
              {search && (
                <button type="button" className="search-clear-btn" onClick={() => { setSearch(""); setCurrentPage(1); }} aria-label="Clear search">
                  ✕
                </button>
              )}
            </div>
            {(search || selectedLanguages.length > 0 || selectedGenres.length > 0 || selectedFormats.length > 0) && (
              <button type="button" className="clear-all-btn" onClick={handleClearAll}>
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="movies-grid">
          {filteredMovies.length > 0 ? (
            paginatedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                poster={movie.poster}
                type="movie"
                rating={movie.rating}
                item={movie}
              />
            ))
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>No movies found matching your filters</p>
              <button type="button" className="reset-btn" onClick={handleClearAll}>
                Reset Filters
              </button>
            </div>
          )}
        </div>
        {filteredMovies.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={filteredMovies.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="movies"
            showPageSize={false}
          />
        )}
      </div>
    </div>
  );
}

export default Movies;
