import { useState, useRef, useEffect } from "react";
import "./FilterBar.css";

function FilterBar({
  onFilterChange,
  selectedLanguages = [],
  selectedGenres = [],
  selectedFormats = [],
  languages = ["Hindi", "English", "Tamil", "Telugu", "Marathi", "Gujarati", "Punjabi", "Bengali"],
  genres = ["Action", "Comedy", "Drama", "Horror", "Romance", "Thriller", "Animation", "Adventure", "Sci-Fi", "Fantasy", "Documentary", "Sports"],
  formats = ["2D", "3D"],
  languageLabel = "Language",
  genreLabel = "Genre",
  formatLabel = "Format",
  showLanguages = true,
  showGenres = true,
  showFormats = false,
}) {
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const genreDropdownRef = useRef(null);
  const formatDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target)) {
        setIsGenreOpen(false);
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target)) {
        setIsFormatOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = (language) => {
    const newLanguages = selectedLanguages.includes(language)
      ? selectedLanguages.filter((l) => l !== language)
      : [...selectedLanguages, language];
    onFilterChange({ languages: newLanguages, genres: selectedGenres, formats: selectedFormats });
  };

  const toggleGenre = (genre) => {
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    onFilterChange({ languages: selectedLanguages, genres: newGenres, formats: selectedFormats });
  };

  const toggleFormat = (format) => {
    const newFormats = selectedFormats.includes(format)
      ? selectedFormats.filter((f) => f !== format)
      : [...selectedFormats, format];
    onFilterChange({ languages: selectedLanguages, genres: selectedGenres, formats: newFormats });
  };

  const clearFilters = () => {
    onFilterChange({ languages: [], genres: [], formats: [] });
  };

  const hasActiveFilters =
    selectedLanguages.length > 0 || selectedGenres.length > 0 || selectedFormats.length > 0;

  return (
    <div className="filter-bar">
      <div className="filter-container">
        {/* Language Dropdown */}
        {showLanguages && languages && languages.length > 0 && (
          <div className="filter-dropdown" ref={languageDropdownRef}>
            <button
              type="button"
              className={`filter-button ${selectedLanguages.length > 0 ? "active" : ""}`}
              onClick={() => {
                setIsLanguageOpen(!isLanguageOpen);
                setIsGenreOpen(false);
                setIsFormatOpen(false);
              }}
              aria-expanded={isLanguageOpen}
            >
              <span className="filter-label">{languageLabel}</span>
              {selectedLanguages.length > 0 && (
                <span className="filter-count">({selectedLanguages.length})</span>
              )}
              <svg
                className={`filter-arrow ${isLanguageOpen ? "open" : ""}`}
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>

            {isLanguageOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Select {languageLabel}</div>
                <div className="checkbox-group">
                  {languages.map((language) => (
                    <label key={language} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(language)}
                        onChange={() => toggleLanguage(language)}
                      />
                      <span>{language}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Genre/Category Dropdown */}
        {showGenres && genres && genres.length > 0 && (
          <div className="filter-dropdown" ref={genreDropdownRef}>
            <button
              type="button"
              className={`filter-button ${selectedGenres.length > 0 ? "active" : ""}`}
              onClick={() => {
                setIsGenreOpen(!isGenreOpen);
                setIsLanguageOpen(false);
                setIsFormatOpen(false);
              }}
              aria-expanded={isGenreOpen}
            >
              <span className="filter-label">{genreLabel}</span>
              {selectedGenres.length > 0 && (
                <span className="filter-count">({selectedGenres.length})</span>
              )}
              <svg
                className={`filter-arrow ${isGenreOpen ? "open" : ""}`}
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>

            {isGenreOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Select {genreLabel}</div>
                <div className="checkbox-group">
                  {genres.map((genre) => (
                    <label key={genre} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => toggleGenre(genre)}
                      />
                      <span>{genre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Format Dropdown (2D, 3D, IMAX 3D, 4DX, etc.) */}
        {showFormats && formats && formats.length > 0 && (
          <div className="filter-dropdown" ref={formatDropdownRef}>
            <button
              type="button"
              className={`filter-button ${selectedFormats.length > 0 ? "active" : ""}`}
              onClick={() => {
                setIsFormatOpen(!isFormatOpen);
                setIsLanguageOpen(false);
                setIsGenreOpen(false);
              }}
              aria-expanded={isFormatOpen}
            >
              <span className="filter-label">{formatLabel}</span>
              {selectedFormats.length > 0 && (
                <span className="filter-count">({selectedFormats.length})</span>
              )}
              <svg
                className={`filter-arrow ${isFormatOpen ? "open" : ""}`}
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </button>

            {isFormatOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Select {formatLabel}</div>
                <div className="checkbox-group">
                  {formats.map((fmt) => (
                    <label key={fmt} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedFormats.includes(fmt)}
                        onChange={() => toggleFormat(fmt)}
                      />
                      <span>{fmt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear Filters Button inside dropdowns */}
        {hasActiveFilters && (
          <button type="button" className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Selected Tags */}
      {hasActiveFilters && (
        <div className="selected-tags">
          {selectedLanguages.map((lang) => (
            <span key={lang} className="tag">
              {lang}
              <button
                type="button"
                onClick={() => toggleLanguage(lang)}
                className="tag-remove"
                aria-label={`Remove ${lang}`}
              >
                ✕
              </button>
            </span>
          ))}
          {selectedGenres.map((genre) => (
            <span key={genre} className="tag">
              {genre}
              <button
                type="button"
                onClick={() => toggleGenre(genre)}
                className="tag-remove"
                aria-label={`Remove ${genre}`}
              >
                ✕
              </button>
            </span>
          ))}
          {selectedFormats.map((fmt) => (
            <span key={fmt} className="tag">
              {fmt}
              <button
                type="button"
                onClick={() => toggleFormat(fmt)}
                className="tag-remove"
                aria-label={`Remove ${fmt}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
