import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredSeatMap, saveStoredSeatMap } from "../utils/ticketStorage";
import { getSeatAvailabilityApi } from "../utils/api";
import "./SportsSeatSelection.css";

const MAX_SEATS = 10;

const stadiumSections = [
  { id: "vip", name: "VIP Box / Pavilion", shortName: "VIP", price: 3500, rows: ["A", "B"], seatsPerRow: 8, color: "#f84464" },
  { id: "platinum", name: "Platinum / Lower Tier", shortName: "Platinum", price: 2000, rows: ["C", "D", "E"], seatsPerRow: 10, color: "#7c6ee6" },
  { id: "gold", name: "Gold / Mid Tier", shortName: "Gold", price: 1200, rows: ["F", "G", "H"], seatsPerRow: 10, color: "#d5a23f" },
  { id: "silver", name: "Silver / Upper Tier", shortName: "Silver", price: 600, rows: ["I", "J", "K"], seatsPerRow: 12, color: "#94a3b8" },
];

const stadiumRings = [
  { id: "silver", rx: 300, ry: 150 },
  { id: "gold", rx: 260, ry: 130 },
  { id: "platinum", rx: 220, ry: 110 },
  { id: "vip", rx: 180, ry: 90 },
];

const bookedSeatIds = new Set([
  "vip-A2",
  "vip-B7",
  "platinum-C4",
  "platinum-D8",
  "gold-F2",
  "silver-K10",
]);

function buildStadiumSeatMap(storageKey) {
  const saved = getStoredSeatMap(storageKey, {});
  const seatMap = {};

  stadiumSections.forEach((section) => {
    section.rows.forEach((row) => {
      for (let seatNumber = 1; seatNumber <= section.seatsPerRow; seatNumber += 1) {
        const seatId = `${section.id}-${row}${seatNumber}`;
        seatMap[seatId] = {
          status: bookedSeatIds.has(seatId) || saved?.[seatId]?.status === "sold" ? "sold" : "available",
        };
      }
    });
  });

  return seatMap;
}

function formatPrice(price) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function SportsSeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const sport = location.state?.sport;
  const time = location.state?.time;
  const selectedDate = location.state?.selectedDate || sport?.date || "";
  const sportId = sport?.id || sport?._id || sport?.key || sport?.title || "event";
  const storageKey = useMemo(
    () => `sport-${sportId}-${selectedDate || "date"}-${time || "time"}`,
    [sportId, selectedDate, time]
  );
  const [selectedSectionId, setSelectedSectionId] = useState("vip");
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatMap, setSeatMap] = useState(() => buildStadiumSeatMap(storageKey));
  const [seatError, setSeatError] = useState("");

  useEffect(() => {
    setSeatMap(buildStadiumSeatMap(storageKey));
    setSelectedSeats([]);
    setSelectedSectionId("vip");
    setSeatError("");
  }, [storageKey]);

  useEffect(() => {
    let active = true;
    getSeatAvailabilityApi({
      type: "Sport",
      itemId: String(sport?.id || sport?._id || ""),
      title: sport?.title || "",
      date: selectedDate,
      showtime: time || "",
      venue: sport?.venue || "",
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
        console.warn("Sports seat availability could not be loaded:", error?.message || error);
      });

    return () => {
      active = false;
    };
  }, [sport?._id, sport?.id, sport?.title, sport?.venue, selectedDate, time]);

  const selectedSection = stadiumSections.find((section) => section.id === selectedSectionId) || stadiumSections[0];
  const totalPrice = selectedSeats.reduce((total, seat) => total + seat.price, 0);
  const selectedSeatIds = selectedSeats.map((seat) => seat.id);
  const selectedSeatLabels = selectedSeats.map((seat) => `${seat.block} - ${seat.label}`);
  const bookingPayload = {
    sportId,
    sportTitle: sport?.title || "",
    selectedDate,
    time,
    venue: sport?.venue || "",
    currency: "INR",
    seats: selectedSeats.map(({ id, sectionId, block, row, seatNumber, price }) => ({
      seatId: id,
      sectionId,
      block,
      row,
      seatNumber,
      price,
      status: "selected",
    })),
    totalPrice,
  };

  if (!sport || !time) {
    return (
      <div className="sports-seat-page min-h-screen px-3 py-6 sm:px-6">
        <div className="sports-seat-empty mx-auto rounded-2xl bg-white p-6 text-center shadow-lg">
          <h2>Sports booking not found</h2>
          <p>Please choose a valid sports event slot from the details page.</p>
          <button type="button" className="sports-seat-back" onClick={() => navigate("/sports")}>
            Browse sports
          </button>
        </div>
      </div>
    );
  }

  const toggleSeat = (seat) => {
    if (seatMap[seat.id]?.status === "sold") return;

    const alreadySelected = selectedSeats.some((selectedSeat) => selectedSeat.id === seat.id);
    if (alreadySelected) {
      setSelectedSeats((currentSeats) => currentSeats.filter((selectedSeat) => selectedSeat.id !== seat.id));
      setSeatError("");
      return;
    }

    if (selectedSeats.length >= MAX_SEATS) {
      setSeatError(`You can select up to ${MAX_SEATS} seats per booking.`);
      return;
    }

    setSelectedSeats((currentSeats) => [...currentSeats, seat]);
    setSeatError("");
  };

  const selectSection = (sectionId) => {
    setSelectedSectionId(sectionId);
    setSeatError("");
  };

  const handleProceed = () => {
    if (!selectedSeats.length) return;

    saveStoredSeatMap(storageKey, seatMap);
    navigate("/payment", {
      state: {
        sport,
        selectedSeats: selectedSeatLabels,
        selectedSeatIds,
        selectedSeatsDetails: bookingPayload.seats,
        seatMapKey: storageKey,
        seatBooking: bookingPayload,
        totalPrice,
        slot: { time, venue: sport.venue },
        selectedDate,
      },
    });
  };

  const renderSeat = (row, seatNumber) => {
    const seatId = `${selectedSection.id}-${row}${seatNumber}`;
    const isSold = seatMap[seatId]?.status === "sold";
    const isSelected = selectedSeats.some((seat) => seat.id === seatId);
    const seat = {
      id: seatId,
      sectionId: selectedSection.id,
      block: selectedSection.shortName,
      row,
      seatNumber,
      label: `${row}${seatNumber}`,
      price: selectedSection.price,
    };

    return (
      <button
        key={seatId}
        type="button"
        className={`stadium-seat${isSelected ? " is-selected" : ""}${isSold ? " is-sold" : ""}`}
        data-tooltip={`${selectedSection.name} · Row ${row} · Seat ${seatNumber} · ${formatPrice(selectedSection.price)}`}
        title={`${selectedSection.name} · Row ${row} · Seat ${seatNumber} · ${formatPrice(selectedSection.price)}`}
        aria-label={`${selectedSection.name}, row ${row}, seat ${seatNumber}, ${formatPrice(selectedSection.price)}${isSold ? ", sold" : isSelected ? ", selected" : ", available"}`}
        aria-pressed={isSelected}
        disabled={isSold}
        onClick={() => toggleSeat(seat)}
      >
        {seatNumber}
      </button>
    );
  };

  return (
    <div className="sports-seat-page min-h-screen px-3 py-6 sm:px-5 lg:px-8 lg:py-10">
      <div className="sports-seat-shell mx-auto">
        <header className="sports-seat-header flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="sports-seat-kicker">Stadium seat selection</p>
            <h1>{sport.title}</h1>
            <p className="sports-seat-subtitle">{sport.venue || "Stadium"} · {selectedDate} · {time}</p>
          </div>
          <button type="button" className="sports-seat-back" onClick={() => navigate(-1)}>
            Change match
          </button>
        </header>

        <div className="sports-seat-layout grid gap-5 lg:grid-cols-2">
          <section className="stadium-card rounded-2xl bg-white p-4 shadow-lg sm:p-6" aria-labelledby="stadium-map-heading">
            <div className="sports-seat-section-heading">
              <div>
                <p className="sports-seat-kicker">Choose a stand</p>
                <h2 id="stadium-map-heading">Stadium map</h2>
              </div>
              <span className="sports-seat-map-hint">Tap a tier to view seats</span>
            </div>

            <div className="stadium-map-wrap">
              <svg
                className="stadium-map"
                viewBox="0 0 720 360"
                role="group"
                aria-label="Oval stadium map. Select a colored tier to view its seats."
              >
                <ellipse cx="360" cy="180" rx="322" ry="166" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                {stadiumRings.map((ring) => {
                  const section = stadiumSections.find((item) => item.id === ring.id);
                  const isSelected = selectedSectionId === ring.id;
                  return (
                    <ellipse
                      key={ring.id}
                      className={`stadium-map-ring${isSelected ? " is-active" : ""}`}
                      cx="360"
                      cy="180"
                      rx={ring.rx}
                      ry={ring.ry}
                      fill="none"
                      stroke={section.color}
                      strokeWidth={isSelected ? 25 : 18}
                      role="button"
                      tabIndex="0"
                      aria-label={`${section.name}, ${formatPrice(section.price)}. Select tier.`}
                      aria-pressed={isSelected}
                      onClick={() => selectSection(section.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectSection(section.id);
                        }
                      }}
                    >
                      <title>{section.name} · {formatPrice(section.price)}</title>
                    </ellipse>
                  );
                })}
                <rect className="stadium-pitch" x="292" y="151" width="136" height="58" rx="8" />
                <line x1="360" y1="152" x2="360" y2="208" className="stadium-pitch-line" />
                <circle cx="360" cy="180" r="13" className="stadium-pitch-line" />
                <text x="360" y="184" textAnchor="middle" className="stadium-pitch-label">PITCH</text>
                <text x="360" y="18" textAnchor="middle" className="stadium-compass-label">NORTH STAND</text>
              </svg>
            </div>

            <div className="stadium-tier-list" aria-label="Stadium tiers">
              {stadiumSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`stadium-tier-option${selectedSectionId === section.id ? " is-active" : ""}`}
                  style={{ "--tier-color": section.color }}
                  aria-pressed={selectedSectionId === section.id}
                  onClick={() => selectSection(section.id)}
                >
                  <span className="stadium-tier-dot" />
                  <span className="stadium-tier-copy">
                    <strong>{section.name}</strong>
                    <small>{formatPrice(section.price)} / seat</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="sports-seat-direction">
              <span aria-hidden="true">↓</span>
              <strong>PLAYING FIELD THIS WAY</strong>
              <span aria-hidden="true">↓</span>
            </div>
          </section>

          <section className="seat-selection-card rounded-2xl bg-white p-4 shadow-lg sm:p-6" aria-labelledby="seat-grid-heading">
            <div className="sports-seat-section-heading">
              <div>
                <p className="sports-seat-kicker">Selected section</p>
                <h2 id="seat-grid-heading">{selectedSection.name}</h2>
              </div>
              <span className="sports-seat-tier-price">{formatPrice(selectedSection.price)} <small>/ seat</small></span>
            </div>
            <p className="sports-seat-instructions">Choose seats in a row. Aisles split the seat blocks.</p>

            <div className="seat-state-legend" aria-label="Seat availability legend">
              <span><i className="seat-legend-dot is-available" />Available</span>
              <span><i className="seat-legend-dot is-selected" />Selected</span>
              <span><i className="seat-legend-dot is-sold" />Booked</span>
            </div>

            <div className="seat-grid-scroll">
              <div className="sports-seat-grid">
                {selectedSection.rows.map((row) => {
                  const splitAt = Math.ceil(selectedSection.seatsPerRow / 2);
                  const leftSeats = Array.from({ length: splitAt }, (_, index) => index + 1);
                  const rightSeats = Array.from(
                    { length: selectedSection.seatsPerRow - splitAt },
                    (_, index) => splitAt + index + 1
                  );
                  return (
                    <div className="sports-seat-row" key={row}>
                      <span className="sports-seat-row-label">{row}</span>
                      <div
                        className="sports-seat-bank"
                        style={{ gridTemplateColumns: `repeat(${leftSeats.length}, minmax(0, 1fr))` }}
                      >
                        {leftSeats.map((seatNumber) => renderSeat(row, seatNumber))}
                      </div>
                      <span className="sports-seat-aisle" aria-hidden="true" />
                      <div
                        className="sports-seat-bank"
                        style={{ gridTemplateColumns: `repeat(${rightSeats.length}, minmax(0, 1fr))` }}
                      >
                        {rightSeats.map((seatNumber) => renderSeat(row, seatNumber))}
                      </div>
                      <span className="sports-seat-row-label">{row}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="sports-seat-cap">Maximum {MAX_SEATS} seats per booking.</p>
            {seatError && <p className="sports-seat-error" role="alert">{seatError}</p>}
          </section>
        </div>

        <aside className="sports-seat-summary sticky bottom-3 z-20 rounded-2xl bg-white p-4 shadow-xl sm:p-5" aria-live="polite">
          <div className="sports-seat-summary-content">
            <div>
              <p className="sports-seat-kicker">Your seats</p>
              {selectedSeats.length ? (
                <div className="sports-seat-selected-list">
                  {stadiumSections.map((section) => {
                    const seatsInSection = selectedSeats.filter((seat) => seat.sectionId === section.id);
                    if (!seatsInSection.length) return null;
                    return (
                      <p key={section.id}>
                        <strong>{section.shortName}</strong> - {seatsInSection.map((seat) => seat.label).join(", ")}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="sports-seat-none">Select up to {MAX_SEATS} seats to continue.</p>
              )}
            </div>
            <div className="sports-seat-total">
              <span>{selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"}</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
            <button
              type="button"
              className="sports-seat-proceed"
              disabled={!selectedSeats.length}
              onClick={handleProceed}
            >
              Proceed to Pay
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SportsSeatSelection;
