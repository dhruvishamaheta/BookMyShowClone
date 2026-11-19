import { useContext } from "react";
import { SearchOverlayContext } from "../context/SearchOverlayContext.jsx";
import "./SearchBar.css";

function SearchBar() {
  const { openSearchOverlay } = useContext(SearchOverlayContext);

  const handleSearchClick = () => {
    openSearchOverlay();
  };

  return (
    <div
      className="search-bar-wrapper"
      onClick={handleSearchClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSearchClick();
        }
      }}
      aria-label="Search for Movies, Events, Plays, Sports and Activities"
    >
      <svg
        className="search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7.5" />
        <line x1="21" y1="21" x2="16.5" y2="16.5" />
      </svg>
      <input
        type="text"
        placeholder="Search for Movies, Events, Plays, Sports and Activities"
        className="search-input"
        readOnly
        tabIndex={-1}
        aria-label="Search for Movies, Events, Plays, Sports and Activities"
      />
    </div>
  );
}

export default SearchBar;
