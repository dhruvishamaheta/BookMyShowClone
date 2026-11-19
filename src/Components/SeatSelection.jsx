import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { getStoredSeatMap, saveStoredSeatMap } from "../utils/ticketStorage";
import { getStoredMovies } from "../utils/adminData";
import { getSelectedCity } from "../utils/userStorage";
import { getCinemasForCity } from "../data/cityCinemasData";
import { getSeatAvailabilityApi } from "../utils/api";
import moviesData from "../data/moviesData";
import "./SeatSelection.css";

function slugify(value) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Order of Cinema Sections: Silver (front) -> Gold (middle) -> Platinum (back VIP)
export const baseCinemaSections = [
  {
    id: "silver",
    name: "Silver",
    tierHeading: "SILVER",
    defaultPrice: 180,
    rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
    seatPartitions: [
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
      [13, 14, 15, 16, 17, 18],
    ],
    leftSeats: [1, 2, 3, 4, 5, 6],
    rightSeats: [7, 8, 9, 10, 11, 12],
  },
  {
    id: "gold",
    name: "Gold",
    tierHeading: "GOLD",
    defaultPrice: 250,
    rows: ["I", "J", "K", "L", "M", "N"],
    seatPartitions: [
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
      [13, 14, 15, 16, 17, 18],
    ],
    leftSeats: [1, 2, 3, 4, 5, 6],
    rightSeats: [7, 8, 9, 10, 11, 12],
  },
  {
    id: "platinum",
    name: "Platinum",
    tierHeading: "PLATINUM RECLINER",
    defaultPrice: 380,
    isRecliner: true,
    rows: ["P"],
    leftSeats: [1, 2, 3, 4, 5, 6],
    rightSeats: [7, 8, 9, 10, 11, 12],
  },
];

const VEHICLE_ICONS = [
  { count: 1, label: "Cycle", icon: "🚲" },
  { count: 2, label: "Scooter", icon: "🛵" },
  { count: 3, label: "Auto", icon: "🛺" },
  { count: 4, label: "Car", icon: "🚗" },
  { count: 5, label: "Sedan", icon: "🚘" },
  { count: 6, label: "SUV", icon: "🚙" },
  { count: 7, label: "Van", icon: "🚐" },
  { count: 8, label: "Minibus", icon: "🚌" },
  { count: 9, label: "Bus", icon: "🚍" },
  { count: 10, label: "Jumbo", icon: "🚂" },
];

const buildMovieSeatMap = (storageKey, sections) => {
  const saved = getStoredSeatMap(storageKey, null);
  const base = {};
  const soldSeats = new Set();
  sections.forEach((section) => {
    section.rows.forEach((row, rowIndex) => {
      const sectionSeats = section.seatPartitions
        ? section.seatPartitions.flat()
        : section.leftSeats.concat(section.rightSeats);
      sectionSeats.forEach((seatNum) => {
        if ((seatNum + rowIndex * 3) % 11 === 3 || (seatNum + rowIndex * 5) % 17 === 7) {
          soldSeats.add(`${section.name}-${row}${seatNum}`);
        }
      });
    });
  });

  sections.forEach((section) => {
    const allSeats = section.seatPartitions
      ? section.seatPartitions.flat()
      : [...section.leftSeats, ...section.rightSeats];
    section.rows.forEach((row) => {
      allSeats.forEach((seatNum) => {
        const seatId = `${section.name}-${row}${seatNum}`;
        base[seatId] = { status: soldSeats.has(seatId) ? "sold" : "available" };
      });
    });
  });

  return saved && Object.keys(saved).length
    ? { ...base, ...saved }
    : base;
};

function SeatSelection() {
  const { id, time: routeTime } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const passedState = location.state || {};
  const theatreName = passedState.theatre || passedState.movie?.theatre || "PVR INOX: Acropolis Mall";
  const currentCity = passedState.city || passedState.movie?.city || getSelectedCity() || "Ahmedabad";
  const selectedDate = passedState.selectedDate || "Today, 06 Oct";
  const showtime = routeTime || passedState.movie?.showtime || "04:30 PM";

  const theatreDetails = useMemo(() => {
    if (passedState.theatreDetails) return passedState.theatreDetails;
    return getCinemasForCity(currentCity).find((cinema) => cinema.name === theatreName) || null;
  }, [passedState.theatreDetails, currentCity, theatreName]);

  const cinemaSections = useMemo(() => {
    const pricing = theatreDetails?.pricing || {};
    return baseCinemaSections.map((section) => {
      const priceKey = section.id;
      const price = Number(pricing[priceKey] ?? section.defaultPrice);
      return {
        ...section,
        price,
        tierHeading: `${section.tierHeading} - RS. ${price.toFixed(2)}`,
      };
    });
  }, [theatreDetails]);

  const normalizedId = slugify(id);
  const allMovies = [...getStoredMovies(), ...moviesData];
  const movie =
    allMovies.find((m) => m.id === id || m._id === id) ||
    allMovies.find((m) => slugify(m.id) === normalizedId) ||
    allMovies.find((m) => slugify(m.title) === normalizedId) ||
    null;

  const movieTitle = movie?.title || passedState.movie?.title || id?.replace(/-/g, " ") || "Selected Movie";
  const moviePoster = movie?.poster || movie?.image || passedState.movie?.poster || "";
  const movieLanguage = movie?.language || passedState.movie?.language || "Hindi";
  const movieFormat = movie?.format || passedState.movie?.format || "2D";
  const movieCertification = movie?.certificate || movie?.certification || "UA 16+";
  const movieGenre = movie?.genre || passedState.movie?.genre || "Action, Drama";

  const storageKey = useMemo(
    () => `movie-${id}-${theatreName.replace(/[^a-z0-9]+/gi, "-")}-${showtime}`,
    [id, theatreName, showtime]
  );

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatMap, setSeatMap] = useState(() => buildMovieSeatMap(storageKey, cinemaSections));
  const [targetSeatCount, setTargetSeatCount] = useState(2);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [hoveredSeat, setHoveredSeat] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let active = true;
    getSeatAvailabilityApi({
      type: "Movie",
      itemId: String(movie?.id || movie?._id || id || ""),
      title: movieTitle,
      date: selectedDate,
      showtime,
      venue: theatreName,
    })
      .then(({ seats = [] }) => {
        if (!active || !Array.isArray(seats)) return;
        setSeatMap((currentMap) => {
          const nextMap = { ...currentMap };
          seats.forEach((seatId) => {
            nextMap[seatId] = { ...(nextMap[seatId] || {}), status: "sold" };
          });
          return nextMap;
        });
      })
      .catch((error) => {
        console.warn("Movie seat availability could not be loaded:", error?.message || error);
      });

    return () => {
      active = false;
    };
  }, [id, movie?._id, movie?.id, movieTitle, selectedDate, showtime, theatreName]);

  const toggleSeat = (seatId, sectionName, row, seatNum, price) => {
    const seatStatus = seatMap[seatId]?.status;
    if (seatStatus === "sold") return;

    const existsIndex = selectedSeats.findIndex((s) => s.id === seatId);

    if (existsIndex > -1) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
    } else {
      if (selectedSeats.length >= targetSeatCount) {
        if (targetSeatCount === 1) {
          setSelectedSeats([{ id: seatId, section: sectionName, row, seatNum, price }]);
        } else {
          setSelectedSeats((prev) => [
            ...prev.slice(1),
            { id: seatId, section: sectionName, row, seatNum, price },
          ]);
        }
      } else {
        setSelectedSeats((prev) => [
          ...prev,
          { id: seatId, section: sectionName, row, seatNum, price },
        ]);
      }
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;

    const nextSeatMap = { ...seatMap };
    selectedSeats.forEach((seat) => {
      nextSeatMap[seat.id] = { status: "selected" };
    });
    setSeatMap(nextSeatMap);
    saveStoredSeatMap(storageKey, nextSeatMap);

    navigate("/payment", {
      state: {
        selectedSeats: selectedSeats.map((s) => s.id),
        selectedSeatIds: selectedSeats.map((s) => s.id),
        selectedSeatsDetails: selectedSeats,
        seatMapKey: storageKey,
        totalPrice,
        movie: {
          id: movie?.id || id,
          title: movieTitle,
          poster: moviePoster,
          theatre: theatreName,
          city: currentCity,
          theatreDetails,
          pricing: Object.fromEntries(
            cinemaSections.map((section) => [section.id, section.price])
          ),
          showtime,
          selectedDate,
          genre: movieGenre,
          language: movieLanguage,
          format: movieFormat,
          certificate: movieCertification,
        },
      },
    });
  };

  const renderSeat = (section, row, seatNum) => {
    const seatId = `${section.name}-${row}${seatNum}`;
    const currentSeat = seatMap[seatId] || { status: "available" };
    const isSelected = selectedSeats.some((s) => s.id === seatId);
    const isSold = currentSeat.status === "sold";
    const isRecliner = section.isRecliner;

    return (
      <button
        key={seatId}
        type="button"
        className={`bms-seat ${isSelected ? "selected" : ""} ${isSold ? "sold" : "available"} ${
          isRecliner ? "recliner" : ""
        }`}
        onClick={() => toggleSeat(seatId, section.name, row, seatNum, section.price)}
        onMouseEnter={() =>
          setHoveredSeat({
            seatId,
            section: section.name,
            row,
            seatNum,
            price: section.price,
            status: isSold ? "Booked" : isSelected ? "Selected" : "Available",
          })
        }
        onMouseLeave={() => setHoveredSeat(null)}
        disabled={isSold}
        aria-label={`${section.name} Row ${row} Seat ${seatNum}, Rs. ${section.price}`}
      >
        <span className="seat-number">{seatNum}</span>
      </button>
    );
  };

  const renderSectionBlock = (section) => (
    <div key={section.id} className="bms-tier-section">
      {/* Real BMS Style Section Header */}
      <div className="bms-tier-header">
        <h3 className="bms-tier-heading">{section.tierHeading}</h3>
      </div>

      {/* Rows Container */}
      <div className="bms-rows-wrapper">
        {section.rows.map((row) => (
          <div key={row} className="bms-row">
            <span className="bms-row-label">{row}</span>
            {section.seatPartitions ? (
              section.seatPartitions.map((seatNumbers, partitionIndex) => (
                <div key={`partition-${partitionIndex}`} className="bms-seat-partition-row">
                  {partitionIndex > 0 && <div className="bms-aisle-gap" />}
                  <div className="bms-seat-group">
                    {seatNumbers.map((num) => renderSeat(section, row, num))}
                  </div>
                </div>
              ))
            ) : (
              <div className="recliner-row">
                {section.leftSeats.concat(section.rightSeats).map((num) =>
                  renderSeat(section, row, num)
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bms-seat-layout-page">
      {/* 1. Authentic BookMyShow Top Header */}
      <header className="bms-seat-header">
        <div className="bms-header-left">
          <button
            type="button"
            className="bms-back-arrow-btn"
            onClick={() => navigate(-1)}
            aria-label="Back to showtimes"
            title="Back"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="bms-movie-details-header">
            <div className="bms-movie-title-line">
              <h1 className="bms-header-title">{movieTitle}</h1>
              <span className="bms-cert-pill">{movieCertification}</span>
            </div>
            <p className="bms-header-subline">
              <strong>{theatreName}</strong> | {selectedDate}, {showtime} | {movieLanguage}, {movieFormat}
            </p>
          </div>
        </div>

        <div className="bms-header-right">
          <button
            type="button"
            className="bms-ticket-count-chip"
            onClick={() => setShowSeatModal(true)}
            title="Change number of seats"
          >
            <span>{targetSeatCount} Tickets</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          <button
            type="button"
            className="bms-close-header-btn"
            onClick={() => navigate(-1)}
            aria-label="Close seat selection"
            title="Close"
          >
            ✕
          </button>
        </div>
      </header>

      {/* 2. Main Seating Area */}
      <main className="bms-seat-canvas-container">
        {/* Screen View At Top */}
        <div className="bms-screen-view">
          <div className="bms-screen-arch" />
          <div className="bms-screen-bar">
            <span className="bms-screen-text">SCREEN THIS WAY</span>
          </div>
          <p className="bms-screen-note">All eyes this way please!</p>
        </div>

        {/* Cinema Sections in Order: Silver -> Gold -> Platinum */}
        <div className="bms-cinema-grid">
          {cinemaSections.map((sec) => renderSectionBlock(sec))}
        </div>

        {/* Real BookMyShow Legend */}
        <div className="bms-legend-bar">
          <div className="bms-legend-item">
            <span className="bms-sample-seat available" />
            <span className="bms-legend-text">Available</span>
          </div>
          <div className="bms-legend-item">
            <span className="bms-sample-seat selected" />
            <span className="bms-legend-text">Selected</span>
          </div>
          <div className="bms-legend-item">
            <span className="bms-sample-seat sold" />
            <span className="bms-legend-text">Sold</span>
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredSeat && (
          <div className="bms-hover-badge">
            <span>{hoveredSeat.section}</span>
            <span className="dot">•</span>
            <span>Row {hoveredSeat.row}, Seat {hoveredSeat.seatNum}</span>
            <span className="dot">•</span>
            <strong className="bms-hover-price">Rs. {hoveredSeat.price}</strong>
          </div>
        )}
      </main>

      {/* 3. Bottom Sticky Action Bar (Real BookMyShow Style) */}
      {selectedSeats.length > 0 && (
        <footer className="bms-floating-checkout-bar">
          <div className="bms-checkout-inner">
            <div className="bms-checkout-info">
              <span className="bms-checkout-seats-title">
                {selectedSeats.length} {selectedSeats.length === 1 ? "Seat" : "Seats"} Selected:
              </span>
              <div className="bms-checkout-chips">
                {selectedSeats.map((s) => (
                  <span key={s.id} className="bms-seat-chip">
                    {s.row}{s.seatNum} ({s.section.slice(0, 3)})
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="bms-pay-cta-btn"
              onClick={handleProceed}
            >
              <span>Pay Rs. {totalPrice.toFixed(2)}</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </footer>
      )}

      {/* 4. Authentic BookMyShow Ticket Count Selector Modal */}
      {showSeatModal && (
        <div className="bms-modal-overlay" onClick={() => setShowSeatModal(false)}>
          <div className="bms-seat-count-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="bms-dialog-header">
              <h3 className="bms-dialog-title">How many seats?</h3>
              <button
                type="button"
                className="bms-dialog-close"
                onClick={() => setShowSeatModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="bms-vehicle-icon-display">
              <span className="bms-vehicle-emoji">
                {VEHICLE_ICONS[targetSeatCount - 1]?.icon || "🚗"}
              </span>
            </div>

            <div className="bms-count-pills-row">
              {VEHICLE_ICONS.map((item) => (
                <button
                  key={item.count}
                  type="button"
                  className={`bms-count-pill ${targetSeatCount === item.count ? "active" : ""}`}
                  onClick={() => setTargetSeatCount(item.count)}
                >
                  {item.count}
                </button>
              ))}
            </div>

            <div className="bms-category-preview-grid">
              {cinemaSections.map((section) => (
                <div className="bms-cat-preview" key={section.id}>
                  <span className="bms-cat-name">{section.name.toUpperCase()}</span>
                  <span className="bms-cat-price">Rs. {section.price.toFixed(2)}</span>
                  <span className="bms-cat-status available">AVAILABLE</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="bms-dialog-submit-btn"
              onClick={() => {
                if (selectedSeats.length > targetSeatCount) {
                  setSelectedSeats(selectedSeats.slice(0, targetSeatCount));
                }
                setShowSeatModal(false);
              }}
            >
              Select Seats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeatSelection;
