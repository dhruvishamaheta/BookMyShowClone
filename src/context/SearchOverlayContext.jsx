import { createContext, useState, useCallback } from "react";

export const SearchOverlayContext = createContext();

export function SearchOverlayProvider({ children }) {
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  const openSearchOverlay = useCallback(() => {
    setIsSearchOverlayOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeSearchOverlay = useCallback(() => {
    setIsSearchOverlayOpen(false);
    document.body.style.overflow = "unset";
  }, []);

  return (
    <SearchOverlayContext.Provider value={{ isSearchOverlayOpen, openSearchOverlay, closeSearchOverlay }}>
      {children}
    </SearchOverlayContext.Provider>
  );
}
