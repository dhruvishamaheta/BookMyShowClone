import "./SearchTabs.css";

function SearchTabs({ activeTab, onTabChange }) {
  const tabs = ["All", "Movies", "Stream", "Events", "Plays", "Sports"];

  return (
    <div className="search-tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`search-tab ${activeTab === tab ? "active" : ""}`}
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default SearchTabs;
