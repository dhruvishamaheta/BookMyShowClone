import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getStoredSeatMap, saveStoredSeatMap } from "../utils/ticketStorage";
import { getSeatAvailabilityApi } from "../utils/api";
import "./EventSeatSelection.css";

const auditoriumSections = [
  { name: "Front Row", price: 900, rows: ["A", "B"], seatsPerRow: 8 },
  { name: "Center", price: 700, rows: ["C", "D", "E"], seatsPerRow: 8 },
  { name: "Balcony", price: 500, rows: ["F", "G", "H"], seatsPerRow: 8 },
];

const concertFanZones = [
  { id: "upper-left", name: "UPPER STAND", price: 1499, row: "K", seats: [1, 2, 3, 4, 5, 6, 7, 8, 9], className: "zone-upper-left" },
  { id: "fan-pit", name: "FAN PIT", price: 14999, row: "F", seats: [1, 2, 3, 4, 5, 6, 7, 8], className: "zone-fan-pit" },
  { id: "upper-right", name: "UPPER STAND", price: 2799, row: "G", seats: [1, 2, 3, 4, 5, 6, 7, 8, 9], className: "zone-upper-right" },
  { id: "gold", name: "GOLD", price: 5999, row: "C", seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], className: "zone-gold" },
  { id: "south-premium", name: "SOUTH PREMIUM", price: 6999, row: "B", seats: [1, 2, 3, 4, 5, 6, 7, 8], className: "zone-south-premium" },
  { id: "west-premium", name: "WEST PREMIUM", price: 4299, row: "A", seats: [1, 2, 3, 4, 5, 6, 7, 8], className: "zone-west-premium" },
  { id: "east-premium", name: "EAST PREMIUM", price: 3299, row: "H", seats: [1, 2, 3, 4, 5, 6, 7, 8], className: "zone-east-premium" },
  { id: "center", name: "CENTER", price: 18999, row: "P", seats: [1, 2, 3, 4, 5, 6], className: "zone-center" },
  { id: "presidential", name: "PRESIDENTIAL GALLERY", price: 15999, row: "J", seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], className: "zone-presidential" },
];

const arenaCenter = { x: 500, y: 320 };

const concertZoneLayouts = {
  "upper-left": {
    color: "#FCE7EC",
    label: { x: 190, y: 180 },
    bands: [{ outer: [475, 330], inner: [430, 295], start: 225, end: 180 }],
    seatArcs: [{ seats: [1, 2, 3, 4, 5, 6, 7, 8, 9], start: 225, end: 180, radii: [452, 312] }],
  },
  "fan-pit": {
    color: "#FFE1E7",
    label: { x: 320, y: 180 },
    bands: [
      { outer: [305, 215], inner: [230, 160], start: 225, end: 180, seats: [1, 2, 3, 4], label: "FAN PIT LEFT", labelPoint: { x: 320, y: 180 } },
      { outer: [305, 215], inner: [230, 160], start: 0, end: -45, seats: [5, 6, 7, 8], label: "FAN PIT RIGHT", labelPoint: { x: 680, y: 180 } },
    ],
    seatArcs: [
      { seats: [1, 2, 3, 4], start: 225, end: 180, radii: [270, 188] },
      { seats: [5, 6, 7, 8], start: 0, end: -45, radii: [270, 188] },
    ],
  },
  "upper-right": {
    color: "#FCE7EC",
    label: { x: 810, y: 180 },
    bands: [{ outer: [475, 330], inner: [430, 295], start: 0, end: -45 }],
    seatArcs: [{ seats: [1, 2, 3, 4, 5, 6, 7, 8, 9], start: 0, end: -45, radii: [452, 312] }],
  },
  gold: {
    color: "#F0EEE9",
    label: { x: 500, y: 500 },
    bands: [{ outer: [365, 250], inner: [305, 210], start: 225, end: -45 }],
    seatArcs: [{ seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], start: 225, end: -45, radii: [335, 230] }],
  },
  "south-premium": {
    color: "#E7E9FF",
    label: { x: 500, y: 548 },
    bands: [{ outer: [430, 295], inner: [365, 250], start: 135, end: 45 }],
    seatArcs: [{ seats: [1, 2, 3, 4, 5, 6, 7, 8], start: 135, end: 45, radii: [397, 272] }],
  },
  "west-premium": {
    color: "#E6F3FF",
    label: { x: 195, y: 280 },
    bands: [{ outer: [430, 295], inner: [365, 250], start: 225, end: 135 }],
    seatArcs: [{ seats: [1, 2, 3, 4, 5, 6, 7, 8], start: 225, end: 135, radii: [397, 272] }],
  },
  "east-premium": {
    color: "#E3F7EF",
    label: { x: 805, y: 280 },
    bands: [{ outer: [430, 295], inner: [365, 250], start: 45, end: -45 }],
    seatArcs: [{ seats: [1, 2, 3, 4, 5, 6, 7, 8], start: 45, end: -45, radii: [397, 272] }],
  },
  center: {
    color: "#ECEAF0",
    label: { x: 500, y: 455 },
    bands: [{ outer: [305, 210], inner: [230, 160], start: 135, end: 45 }],
    seatArcs: [{ seats: [1, 2, 3, 4, 5, 6], start: 135, end: 45, radii: [267, 185] }],
  },
  presidential: {
    color: "#F0EEE9",
    label: { x: 500, y: 675 },
    bands: [{ outer: [475, 330], inner: [430, 295], start: 135, end: 45 }],
    seatArcs: [{ seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], start: 135, end: 45, radii: [452, 312] }],
  },
};

const polarToCartesian = (center, radii, angle) => {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center.x + radii[0] * Math.cos(radians),
    y: center.y + radii[1] * Math.sin(radians),
  };
};

const createArcBandPath = ({ outer, inner, start, end }) => {
  const outerStart = polarToCartesian(arenaCenter, outer, start);
  const outerEnd = polarToCartesian(arenaCenter, outer, end);
  const innerEnd = polarToCartesian(arenaCenter, inner, end);
  const innerStart = polarToCartesian(arenaCenter, inner, start);
  const largeOuterArc = Math.abs(end - start) > 180 ? 1 : 0;
  const innerSweep = 1;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outer[0]} ${outer[1]} 0 ${largeOuterArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${inner[0]} ${inner[1]} 0 ${largeOuterArc} ${innerSweep} ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
};

const getArcSeatPoint = (arc, index, count) => {
  const angle = arc.start + ((index + 1) / (count + 1)) * (arc.end - arc.start);
  return polarToCartesian(arenaCenter, arc.radii, angle);
};

const isConcertEvent = (event) => {
  const category = String(event?.category || "").toLowerCase();
  const type = String(event?.type || "").toLowerCase();
  return category === "auditorium" || category === "outdoor" || type.includes("concert") || type.includes("music");
};

const buildAuditoriumSeatMap = (storageKey) => {
  const saved = getStoredSeatMap(storageKey, null);
  if (saved && Object.keys(saved).length) return saved;

  const base = {};
  const soldSeats = new Set(["Front Row-A1", "Front Row-B4", "Center-C2", "Center-E5", "Balcony-F7", "Balcony-H3"]);

  auditoriumSections.forEach((section) => {
    section.rows.forEach((row) => {
      for (let i = 1; i <= section.seatsPerRow; i += 1) {
        const seatId = `${section.name}-${row}${i}`;
        base[seatId] = { status: soldSeats.has(seatId) ? "sold" : "available" };
      }
    });
  });

  return base;
};

const buildConcertSeatMap = (storageKey) => {
  const saved = getStoredSeatMap(storageKey, null);
  if (saved && Object.keys(saved).length) return saved;

  const base = {};
  const soldSeats = new Set([
    "UPPER STAND-K3",
    "UPPER STAND-G6",
    "GOLD-C5",
    "GOLD-C8",
    "SOUTH PREMIUM-B3",
    "WEST PREMIUM-A6",
    "EAST PREMIUM-H4",
  ]);

  concertFanZones.forEach((zone) => {
    zone.seats.forEach((seatNumber) => {
      const seatId = `${zone.name}-${zone.row}${seatNumber}`;
      base[seatId] = { status: soldSeats.has(seatId) ? "sold" : "available" };
    });
  });

  return base;
};

function EventSeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { event, slot, selectedDate } = location.state || {};

  const [selectedSeats, setSelectedSeats] = useState([]);
  const storageKey = useMemo(
    () => `event-${event?.id || event?._id || event?.title || "default"}-${selectedDate || event?.date || "date"}-${slot?.time || "slot"}`,
    [event?.id, event?._id, event?.title, event?.date, selectedDate, slot?.time]
  );
  const concertLayout = isConcertEvent(event);
  const [seatMap, setSeatMap] = useState(() =>
    concertLayout ? buildConcertSeatMap(storageKey) : buildAuditoriumSeatMap(storageKey)
  );
  const [showPrices, setShowPrices] = useState(true);
  const [highlightFastFilling, setHighlightFastFilling] = useState(false);
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const eventDate = selectedDate || event?.date || "Date to be announced";
  const venue = slot?.venue || event?.venue || "Venue to be announced";
  const eventLocation = event?.location || event?.address || event?.venue || venue;

  useEffect(() => {
    let active = true;
    getSeatAvailabilityApi({
      type: "Event",
      itemId: String(event?.id || event?._id || ""),
      title: event?.title || "",
      date: eventDate,
      showtime: slot?.time || "",
      venue,
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
        console.warn("Event seat availability could not be loaded:", error?.message || error);
      });

    return () => {
      active = false;
    };
  }, [event?._id, event?.id, event?.title, eventDate, slot?.time, venue]);

  const toggleSeat = (seatId, price) => {
    const currentStatus = seatMap[seatId]?.status;
    if (currentStatus === "sold") return;

    const exists = selectedSeats.some((seat) => seat.id === seatId);
    if (exists) {
      setSelectedSeats((prev) => prev.filter((seat) => seat.id !== seatId));
    } else {
      setSelectedSeats((prev) => [...prev, { id: seatId, price }]);
    }
  };

  const getAvailableSeatCount = (zone, seatNumbers = zone.seats) =>
    seatNumbers.filter((seatNumber) => seatMap[`${zone.name}-${zone.row}${seatNumber}`]?.status !== "sold").length;

  const toggleNextAvailableSeat = (zone, seatNumbers = zone.seats) => {
    const seatNumber = seatNumbers.find((number) => {
      const seatId = `${zone.name}-${zone.row}${number}`;
      return seatMap[seatId]?.status !== "sold" && !selectedSeats.some((seat) => seat.id === seatId);
    });

    if (seatNumber !== undefined) {
      toggleSeat(`${zone.name}-${zone.row}${seatNumber}`, zone.price);
    }
  };

  const handleArenaKeyDown = (event, onActivate) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  };

  const renderPartition = (label, price, rows, seatsPerRow) => (
    <div className={`partition ${label === "Balcony" ? "partition-balcony" : ""}`}>
      <div className="partition-header">
        <h3>{label}</h3>
        <span>₹{price}</span>
      </div>
      {rows.map((row) => (
        <div key={row} className="seat-row seat-row-half">
          <span className="row-label">{row}</span>
          {Array.from({ length: seatsPerRow }, (_, i) => {
            const seatId = `${label}-${row}${i + 1}`;
            const isSelected = selectedSeats.some((seat) => seat.id === seatId);
            const isSold = seatMap[seatId]?.status === "sold";
            return (
              <button
                type="button"
                key={seatId}
                className={`seat ${isSelected ? "selected" : ""} ${isSold ? "sold" : ""}`}
                onClick={() => toggleSeat(seatId, price)}
                disabled={isSold}
                aria-label={`${label}, row ${row}, seat ${i + 1}, ₹${price}${isSold ? ", sold" : isSelected ? ", selected" : ", available"}`}
                aria-pressed={isSelected}
                style={{ "--seat-curve": `${Math.abs(i - (seatsPerRow - 1) / 2) * 5}px` }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderConcertArena = () => (
    <div className="concert-arena-shell">
      <div className="concert-tools" aria-label="Seating map filters">
        <button type="button" className={showPrices ? "active" : ""} aria-pressed={showPrices} onClick={() => setShowPrices((visible) => !visible)}>
          Prices
        </button>
        <button type="button" className={highlightFastFilling ? "active" : ""} aria-pressed={highlightFastFilling} onClick={() => setHighlightFastFilling((enabled) => !enabled)}>
          Fast Filling
        </button>
      </div>
      <p className="concert-instructions">Select a numbered seat or click a section to select its next available seat.</p>

      <div className="concert-map-wrap">
        <svg
          className="concert-arena"
          viewBox="0 0 1000 750"
          role="group"
          aria-label="Interactive curved concert stadium seating map"
        >
          <path
            className="arena-bowl-outline"
            d={createArcBandPath({ outer: [488, 342], inner: [480, 334], start: 225, end: -45 })}
          />

          {concertFanZones.map((zone) => {
            const layout = concertZoneLayouts[zone.id];
            const availableSeats = getAvailableSeatCount(zone);
            const isSoldOut = availableSeats === 0;
            const isFastFilling = availableSeats < zone.seats.length;
            const zoneColor = isSoldOut ? "#E5E7EB" : layout.color;

            return (
              <g
                key={`${zone.id}-shapes`}
                className={`arena-zone ${hoveredZoneId === zone.id ? "hovered" : ""} ${highlightFastFilling && isFastFilling ? "fast-filling" : ""}`}
                onMouseEnter={() => setHoveredZoneId(zone.id)}
                onMouseLeave={() => setHoveredZoneId(null)}
                onFocus={() => setHoveredZoneId(zone.id)}
                onBlur={() => setHoveredZoneId(null)}
              >
                {layout.bands.map((band, bandIndex) => {
                  const bandSeats = band.seats || zone.seats;
                  const availableBandSeats = getAvailableSeatCount(zone, bandSeats);
                  return (
                    <path
                      key={`${zone.id}-band-${bandIndex}`}
                      className="arena-zone-shape"
                      d={createArcBandPath(band)}
                      fill={zoneColor}
                      tabIndex={availableBandSeats === 0 ? -1 : 0}
                      role="button"
                      aria-disabled={availableBandSeats === 0}
                      aria-label={`${band.label || zone.name}, ₹${zone.price.toLocaleString("en-IN")}, ${availableBandSeats} seats available. Select next available seat.`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleNextAvailableSeat(zone, bandSeats);
                      }}
                      onKeyDown={(event) => handleArenaKeyDown(event, () => toggleNextAvailableSeat(zone, bandSeats))}
                    >
                      <title>{band.label || zone.name} · ₹{zone.price.toLocaleString("en-IN")} · {availableBandSeats} seats available</title>
                    </path>
                  );
                })}
              </g>
            );
          })}

          {concertFanZones.map((zone) => {
            const layout = concertZoneLayouts[zone.id];
            return layout.bands.map((band, bandIndex) => {
              const labelPoint = band.labelPoint || layout.label;
              const label = band.label || (zone.name === "UPPER STAND" ? "BALCONY · UPPER STAND" : zone.name);
              return (
                <g key={`${zone.id}-label-${bandIndex}`} className="arena-zone-label-group">
                  <text className="arena-zone-label" x={labelPoint.x} y={labelPoint.y - 17} textAnchor="middle">
                    {label}
                  </text>
                  {showPrices && (
                    <g className="arena-price-pill" transform={`translate(${labelPoint.x - 56} ${labelPoint.y - 8})`}>
                      <rect width="112" height="28" rx="14" />
                      <circle cx="15" cy="14" r="4" fill={getAvailableSeatCount(zone) === 0 ? "#9CA3AF" : "#F84464"} />
                      <text x="65" y="19" textAnchor="middle">₹{zone.price.toLocaleString("en-IN")}</text>
                    </g>
                  )}
                </g>
              );
            });
          })}

          {concertFanZones.map((zone) => {
            const layout = concertZoneLayouts[zone.id];
            return zone.seats.map((seatNumber) => {
              const seatId = `${zone.name}-${zone.row}${seatNumber}`;
              const isSelected = selectedSeats.some((seat) => seat.id === seatId);
              const isSold = seatMap[seatId]?.status === "sold";
              const seatArc = layout.seatArcs.find((arc) => arc.seats.includes(seatNumber));
              const arcIndex = seatArc.seats.indexOf(seatNumber);
              const point = getArcSeatPoint(seatArc, arcIndex, seatArc.seats.length);
              const fill = isSold ? "#E5E7EB" : isSelected ? "#F84464" : "#FFFFFF";
              const stroke = isSold ? "#9CA3AF" : isSelected ? "#FFFFFF" : layout.color;

              return (
                <g
                  key={seatId}
                  className={`arena-seat ${isSelected ? "selected" : ""} ${isSold ? "sold" : ""}`}
                  transform={`translate(${point.x} ${point.y})`}
                  role="button"
                  tabIndex={isSold ? -1 : 0}
                  aria-label={`${zone.name}, row ${zone.row}, seat ${seatNumber}, ₹${zone.price.toLocaleString("en-IN")}, ${isSold ? "sold" : isSelected ? "selected" : "available"}`}
                  aria-pressed={isSelected}
                  aria-disabled={isSold}
                  onMouseEnter={() => setHoveredZoneId(zone.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSeat(seatId, zone.price);
                  }}
                  onKeyDown={(event) => handleArenaKeyDown(event, () => toggleSeat(seatId, zone.price))}
                >
                  <circle r="12" fill={fill} stroke={stroke} strokeWidth={isSelected ? 2.5 : 1.5} />
                  <text y="4" textAnchor="middle" fill={isSold ? "#6B7280" : isSelected ? "#FFFFFF" : "#111827"}>
                    {seatNumber}
                  </text>
                  <title>{zone.name} · Row {zone.row} · Seat {seatNumber} · ₹{zone.price.toLocaleString("en-IN")}</title>
                </g>
              );
            });
          })}

          {highlightFastFilling && concertFanZones.map((zone) => {
            if (getAvailableSeatCount(zone) === zone.seats.length) return null;
            const point = concertZoneLayouts[zone.id].label;
            return (
              <text key={`${zone.id}-fast-filling`} className="arena-fast-filling-label" x={point.x} y={point.y + 35} textAnchor="middle">
                FAST FILLING
              </text>
            );
          })}

          <g className="arena-runway">
            <path d="M 445 88 L 555 88 L 555 240 L 610 270 L 390 270 L 445 240 Z" />
            <rect x="365" y="30" width="270" height="62" rx="10" />
            <text x="500" y="69" textAnchor="middle">STAGE</text>
            <text className="arena-runway-label" x="500" y="196" textAnchor="middle">RUNWAY</text>
          </g>
        </svg>

        {hoveredZoneId && (() => {
          const zone = concertFanZones.find((item) => item.id === hoveredZoneId);
          return zone ? (
            <div className="arena-hover-card" role="status">
              <strong>{zone.name}</strong>
              <span className="arena-hover-price">₹{zone.price.toLocaleString("en-IN")} per seat</span>
              <span>{getAvailableSeatCount(zone)} seats available</span>
            </div>
          ) : null;
        })()}
      </div>

      <div className="concert-legend">
        <span><i className="legend-seat" />Available</span>
        <span><i className="legend-seat selected" />Selected</span>
        <span><i className="legend-seat sold" />Sold Out</span>
        <span><i className="legend-seat restricted" />Restricted View</span>
      </div>
    </div>
  );

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const handleProceed = () => {
    const nextSeatMap = { ...seatMap };
    selectedSeats.forEach((seat) => {
      nextSeatMap[seat.id] = { status: "selected" };
    });
    setSeatMap(nextSeatMap);
    saveStoredSeatMap(storageKey, nextSeatMap);

    navigate("/payment", {
      state: {
        selectedSeats: selectedSeats.map((seat) => seat.id),
        selectedSeatIds: selectedSeats.map((seat) => seat.id),
        selectedSeatsDetails: selectedSeats,
        seatMapKey: storageKey,
        totalPrice,
        event,
        slot,
        selectedDate: eventDate,
      },
    });
  };

  if (!event || !slot) {
    return (
      <div className="event-seat-selection empty-state">
        <h2>Event booking not found</h2>
        <p>Please choose an event and showtime before selecting seats.</p>
        <button type="button" className="confirm-btn" onClick={() => navigate("/events")}>
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <div className="event-seat-selection">
      <div className="event-seat-card">
        {event.poster && <img className="event-seat-poster" src={event.poster} alt={`${event.title} poster`} />}
        <div className="event-seat-details">
          <p className="section-kicker">{concertLayout ? "Concert Seating Map" : "Event Seating"}</p>
          <h2>{event.title || "Event"}</h2>
          {event.description && <p className="event-seat-description">{event.description}</p>}
          <div className="event-seat-meta">
            <p><strong>Date:</strong> {eventDate}</p>
            <p><strong>Showtime:</strong> {slot.time}</p>
            <p><strong>Venue:</strong> {venue}</p>
            <p className="seat-location"><strong>Location:</strong> {eventLocation}</p>
            {event.category && <p><strong>Category:</strong> {event.category}</p>}
          </div>
        </div>
      </div>

        {concertLayout
          ? renderConcertArena()
          : (
              <div className="auditorium-layout">
              <div className="screen">STAGE</div>
              {auditoriumSections.map((section) =>
                renderPartition(section.name, section.price, section.rows, section.seatsPerRow)
              )}
              </div>
          )}

        {selectedSeats.length > 0 && (
          <footer className="event-seat-checkout-bar">
            <div className="event-seat-checkout-inner">
              <div className="event-seat-checkout-selection">
                <strong>{selectedSeats.length} {selectedSeats.length === 1 ? "Seat" : "Seats"} Selected</strong>
                <div className="event-seat-checkout-chips">
                  {selectedSeats.map((seat) => (
                    <span key={seat.id} className="event-seat-chip">
                      {seat.id} · ₹{seat.price.toLocaleString("en-IN")}
                    </span>
                  ))}
                </div>
              </div>
              <button type="button" className="event-seat-pay-button" onClick={handleProceed}>
                Proceed · ₹{totalPrice.toLocaleString("en-IN")}
              </button>
            </div>
          </footer>
        )}
    </div>
  );
}

export default EventSeatSelection;
