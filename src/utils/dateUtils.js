/**
 * Date Utilities for Start and End Date Management
 * Handles normalization, expiration checking, active filtering, and booking dates generation.
 */

export const DEFAULT_START_DATE = "2026-01-01";
export const DEFAULT_EXPIRY_DATE = "2026-12-30";

const MONTH_MAP = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  january: "01", february: "02", march: "03", april: "04", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
};

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayYMD() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns a date string shifted by N days from today in YYYY-MM-DD format
 */
export function getOffsetDateYMD(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses any date representation (YYYY-MM-DD, Date object, "24 Oct 2026", "20 July")
 * into a canonical YYYY-MM-DD string.
 */
export function parseToYMD(dateInput, fallbackYear = 2026) {
  if (!dateInput) return null;
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const str = String(dateInput).trim();
  
  // 1. Matches YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. Matches DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // 3. Matches text formats like "Sat 24 Oct 2026", "20 Nov 2026", "14 Feb", "20 July"
  const cleanStr = str.replace(/^[a-zA-Z]+,\s*/, "").replace(/^[a-zA-Z]+\s+/, "");
  const parts = cleanStr.split(/[\s,]+/);

  let day = null;
  let month = null;
  let year = fallbackYear;

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (MONTH_MAP[lower]) {
      month = MONTH_MAP[lower];
    } else if (/^\d{4}$/.test(part)) {
      year = parseInt(part, 10);
    } else if (/^\d{1,2}$/.test(part)) {
      day = part.padStart(2, "0");
    }
  }

  if (day && month) {
    return `${year}-${month}-${day}`;
  }

  // Fallback to JS Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Returns formatted human-readable date e.g. "30 Dec 2026"
 */
export function formatDisplayDate(ymdString) {
  if (!ymdString) return "N/A";
  const ymd = parseToYMD(ymdString);
  if (!ymd) return String(ymdString);
  const [y, m, d] = ymd.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return ymdString;
  return dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isConcertEvent(item) {
  const eventInfo = `${item?.title || ""} ${item?.type || ""} ${item?.category || ""}`;
  if (/comedy|stand[\s-]?up/i.test(eventInfo)) return false;
  return /concert|music|symphony|orchestra|live/i.test(eventInfo);
}

export function getEventBookingEndDate(item) {
  if (!item) return null;
  return resolveItemDates(item).endDate;
}

/**
 * Resolves standard startDate and endDate for any item (movie, event, sport, activity).
 * Defaults active window to 2026-01-01 -> 2026-12-30.
 */
export function resolveItemDates(item) {
  if (!item) {
    return { startDate: DEFAULT_START_DATE, endDate: DEFAULT_EXPIRY_DATE };
  }

  let startDate = item.startDate ? parseToYMD(item.startDate) : null;
  let endDate = item.endDate ? parseToYMD(item.endDate) : null;

  // If item doesn't have an explicit startDate
  if (!startDate) {
    if (item.date) {
      const parsed = parseToYMD(item.date);
      startDate = parsed && parsed >= "2026-01-01" ? parsed : DEFAULT_START_DATE;
    } else {
      startDate = DEFAULT_START_DATE;
    }
  }

  // If item doesn't have an explicit endDate or had legacy end date older than current window
  if (!endDate || endDate < "2026-01-01") {
    endDate = DEFAULT_EXPIRY_DATE;
  }

  if (!startDate) startDate = DEFAULT_START_DATE;
  if (!endDate) endDate = DEFAULT_EXPIRY_DATE;

  return { startDate, endDate };
}

/**
 * Checks if an item is active and available for purchase on the user side.
 * Returns true if today <= endDate (i.e. endDate has not passed yet).
 */
export function isItemActive(item) {
  if (!item) return false;
  const today = getTodayYMD();
  const bookingEndDate = getEventBookingEndDate(item);
  return Boolean(bookingEndDate && today <= bookingEndDate);
}

/**
 * Returns comprehensive status object for Admin and UI cards:
 * status: "active" | "upcoming" | "expired"
 */
export function getItemDateStatus(item) {
  const today = getTodayYMD();
  const { startDate, endDate } = resolveItemDates(item);
  const bookingEndDate = getEventBookingEndDate(item) || endDate;

  let status = "active";
  let label = "Active Now";
  let badgeClass = "status-active";

  if (today > bookingEndDate) {
    status = "expired";
    label = "Ended / Expired";
    badgeClass = "status-expired";
  } else if (today < startDate) {
    status = "upcoming";
    label = "Upcoming";
    badgeClass = "status-upcoming";
  } else {
    status = "active";
    label = "Active Now";
    badgeClass = "status-active";
  }

  return {
    status,
    label,
    badgeClass,
    startDate,
    endDate,
    bookingEndDate,
    startDateFormatted: formatDisplayDate(startDate),
    endDateFormatted: formatDisplayDate(endDate),
    bookingEndDateFormatted: formatDisplayDate(bookingEndDate),
    isAvailable: today <= bookingEndDate,
  };
}

/**
 * Filters an array or dictionary of items so only currently active (not expired) items are shown.
 */
export function filterActiveItems(items) {
  if (!items) return items;
  if (Array.isArray(items)) {
    return items.filter((item) => isItemActive(item));
  }
  if (typeof items === "object") {
    const activeEntries = Object.entries(items).filter(([_, item]) => isItemActive(item));
    return Object.fromEntries(activeEntries);
  }
  return items;
}

/**
 * Sorts records with the newest created records first while preserving the
 * existing order for records without a creation timestamp.
 */
export function sortItemsByNewest(items) {
  return [...(items || [])].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

/**
 * Generates valid selectable booking date pills between [max(today, startDate)] and [endDate].
 */
export function generateValidBookingDates(item, maxPills = 7) {
  const today = getTodayYMD();
  const { startDate, endDate } = resolveItemDates(item);

  const effectiveStart = startDate > today ? startDate : today;
  const [sy, sm, sd] = effectiveStart.split("-").map(Number);
  const [ey, em, ed] = (endDate >= effectiveStart ? endDate : effectiveStart).split("-").map(Number);

  const startObj = new Date(sy, sm - 1, sd);
  const endObj = new Date(ey, em - 1, ed);

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  const dates = [];
  const curr = new Date(startObj);

  let count = 0;
  while (curr <= endObj && count < maxPills) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, "0");
    const day = String(curr.getDate()).padStart(2, "0");
    const ymd = `${year}-${month}-${day}`;

    const isToday = ymd === today;
    const isTomorrow = ymd === getOffsetDateYMD(1);

    dates.push({
      label: isToday ? "TODAY" : isTomorrow ? "TOM" : dayNames[curr.getDay()],
      dateNumber: curr.getDate().toString().padStart(2, "0"),
      month: monthNames[curr.getMonth()],
      dayName: dayNames[curr.getDay()],
      fullDate: curr.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      ymd,
      isToday,
    });

    curr.setDate(curr.getDate() + 1);
    count++;
  }

  // Fallback if range produced empty array
  if (dates.length === 0) {
    const now = new Date();
    dates.push({
      label: "TODAY",
      dateNumber: now.getDate().toString().padStart(2, "0"),
      month: monthNames[now.getMonth()],
      dayName: dayNames[now.getDay()],
      fullDate: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      ymd: today,
      isToday: true,
    });
  }

  return dates;
}
