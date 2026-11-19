import React from "react";
import "./Pagination.css";

/**
 * Reusable Pagination Component for BookMyShow
 * @param {number} currentPage - Currently active page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items across all pages
 * @param {number} itemsPerPage - Number of items shown per page
 * @param {function} onPageChange - Callback when a new page is selected
 * @param {function} [onItemsPerPageChange] - Optional callback when items-per-page is modified
 * @param {number[]} [pageSizeOptions=[8, 12, 16, 24]] - Available page size options
 * @param {string} [itemLabel="items"] - Plural noun for items (e.g. "movies", "events", "items")
 * @param {boolean} [showPageSize=true] - Whether to show the page size picker
 */
function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 8,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [8, 12, 16, 24],
  itemLabel = "items",
  showPageSize = true,
  className = "",
}) {
  // If no items or only 1 page and no size changer needed, still render clean if totalItems > 0
  if (totalPages <= 1 && totalItems <= itemsPerPage && !onItemsPerPageChange) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageClick = (page) => {
    if (page === "..." || page === currentPage || page < 1 || page > totalPages) {
      return;
    }
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={`bms-pagination-wrapper ${className}`}
      aria-label="Pagination Navigation"
    >
      <div className="bms-pagination-container">
        {/* Items Summary Info */}
        <div className="bms-pagination-info">
          {totalItems > 0 ? (
            <span>
              Showing <strong className="bms-info-highlight">{startItem}–{endItem}</strong> of{" "}
              <strong className="bms-info-highlight">{totalItems}</strong> {itemLabel}
            </span>
          ) : (
            <span>Page {currentPage} of {Math.max(totalPages, 1)}</span>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="bms-pagination-controls">
          {/* First Page Button */}
          <button
            type="button"
            className="bms-page-nav-btn bms-page-first-btn"
            onClick={() => handlePageClick(1)}
            disabled={currentPage <= 1}
            aria-label="Go to first page"
            title="First Page"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            className="bms-page-nav-btn bms-page-prev-btn"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Go to previous page"
            title="Previous Page"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="bms-nav-btn-text">Prev</span>
          </button>

          {/* Page Number Pills */}
          <div className="bms-page-numbers-list">
            {pageNumbers.map((page, idx) => {
              if (page === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="bms-page-ellipsis">
                    •••
                  </span>
                );
              }
              const isActive = page === currentPage;
              return (
                <button
                  key={`page-${page}`}
                  type="button"
                  className={`bms-page-number-btn ${isActive ? "active" : ""}`}
                  onClick={() => handlePageClick(page)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            className="bms-page-nav-btn bms-page-next-btn"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Go to next page"
            title="Next Page"
          >
            <span className="bms-nav-btn-text">Next</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            className="bms-page-nav-btn bms-page-last-btn"
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label="Go to last page"
            title="Last Page"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </button>
        </div>

        {/* Page Size Selector */}
        {showPageSize && onItemsPerPageChange && (
          <div className="bms-pagination-size-select">
            <label htmlFor="bms-items-per-page" className="bms-size-label">
              Show:
            </label>
            <select
              id="bms-items-per-page"
              className="bms-size-dropdown"
              value={itemsPerPage}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onItemsPerPageChange(newSize);
                if (onPageChange) onPageChange(1); // Reset to page 1 on size change
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Pagination;
