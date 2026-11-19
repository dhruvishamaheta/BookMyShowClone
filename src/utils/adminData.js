import eventsData from "../data/eventsData";
import eventShowtime from "../data/eventShowtime";
import moviesData from "../data/moviesData";
import showtimesData from "../data/showtimesData";
import sportsData from "../data/sportsData";
import sportsTimeData from "../data/sportsTimeData";
import activitiesData from "../data/activityData";
import {
  createActivityApi,
  createEventApi,
  createMovieApi,
  createSportApi,
  deleteActivityApi,
  deleteEventApi,
  deleteMovieApi,
  deleteSportApi,
  getActivitiesApi,
  getEventsApi,
  getMoviesApi,
  getSportsApi,
  updateActivityApi,
  updateEventApi,
  updateMovieApi,
  updateSportApi,
} from "./api";
import { getUsersApi } from "./authApi";
import { saveUsers } from "./userStorage";
import {
  DEFAULT_EXPIRY_DATE,
  getEventBookingEndDate,
  isConcertEvent,
  parseToYMD,
  resolveItemDates,
} from "./dateUtils";

const MOVIES_STORAGE_KEY = "bookmyshow_admin_movies";
const EVENTS_STORAGE_KEY = "bookmyshow_admin_events";
const SPORTS_STORAGE_KEY = "bookmyshow_admin_sports";
const ACTIVITIES_STORAGE_KEY = "bookmyshow_admin_activities";

const isBrowser = () => typeof window !== "undefined";

function isMongoId(value) {
  return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
}

function slugify(value) {
  return (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function getStoredData(storageKey, defaultData) {
  if (!isBrowser()) return defaultData;
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaultData;
    const parsed = JSON.parse(saved);
    if (parsed) {
      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed : defaultData;
      }
      if (typeof parsed === "object") {
        return Object.keys(parsed).length > 0 ? parsed : defaultData;
      }
    }
    return defaultData;
  } catch {
    return defaultData;
  }
}

function saveStoredData(storageKey, data) {
  if (!isBrowser()) return data;
  localStorage.setItem(storageKey, JSON.stringify(data));
  return data;
}

export function normalizeEvents(events) {
  return (events || []).map((event) => {
    const eventDate = parseToYMD(event.date);
    const { startDate, endDate } = resolveItemDates(event);
    const isLegacySingleDateRange =
      eventDate &&
      parseToYMD(event.startDate) === eventDate &&
      parseToYMD(event.endDate) === DEFAULT_EXPIRY_DATE;
    const normalizedStartDate = eventDate && (!event.startDate || isLegacySingleDateRange)
      ? eventDate
      : event.startDate || startDate;
    const isInvalidConcertEndDate =
      isConcertEvent(event) &&
      eventDate &&
      normalizedStartDate === eventDate &&
      parseToYMD(event.endDate) &&
      parseToYMD(event.endDate) < eventDate;
    const normalizedEndDate = (
      (eventDate && (!event.endDate || isLegacySingleDateRange)) ||
      isInvalidConcertEndDate
    )
      ? eventDate
      : event.endDate || endDate;
    const eventWithDates = {
      ...event,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
    };

    return {
      ...eventWithDates,
      bookingEndDate: getEventBookingEndDate(eventWithDates),
      id: event.id || event._id || `event-${slugify(event.title || "event")}`,
      showtimes: Array.isArray(event.showtimes) && event.showtimes.length > 0
        ? event.showtimes
        : (eventShowtime[event.id] || []).map((slot) => ({ ...slot })),
    };
  });
}

function normalizeMovies(movies) {
  return (movies || []).map((movie) => {
    const isSpider = movie.title?.toLowerCase().includes("spider") || movie.id === "spider-man";
    const defaultMovie = moviesData.find((m) => m.id === movie.id || m.title === movie.title);
    const { startDate, endDate } = resolveItemDates(movie);
    return {
      ...movie,
      startDate: movie.startDate || startDate,
      endDate: movie.endDate && movie.endDate >= "2026-10-01" ? movie.endDate : endDate,
      format: isSpider ? "3D" : (movie.format || defaultMovie?.format || "2D"),
      id: movie.id || movie._id || `movie-${slugify(movie.title || "movie")}`,
      showtimes: Array.isArray(movie.showtimes) && movie.showtimes.length > 0
        ? movie.showtimes
        : (showtimesData[movie.id] || []).map((theatre) => ({ ...theatre, times: [...theatre.times] })),
    };
  });
}

function normalizeActivities(activities) {
  return (activities || []).map((activity) => {
    const { startDate, endDate } = resolveItemDates(activity);
    return {
      ...activity,
      startDate: activity.startDate || startDate,
      endDate: activity.endDate && activity.endDate >= "2026-10-01" ? activity.endDate : endDate,
      id: activity.id || activity._id || `activity-${slugify(activity.title || "activity")}`,
    };
  });
}

function normalizeUsers(users) {
  return (users || []).map((user) => ({
    ...user,
    id: user.id || user._id || null,
  }));
}

function normalizeSports(sports) {
  if (Array.isArray(sports)) {
    return Object.fromEntries(
      sports.map((sport) => {
        const normalizedKey = sport?.key || (sport?.title ? slugify(sport.title) : null) || sport?.id || sport?._id || "sport";
        const { startDate, endDate } = resolveItemDates(sport);
        return [
          normalizedKey,
          {
            ...sport,
            startDate: sport.startDate || startDate,
            endDate: sport.endDate && sport.endDate >= "2026-10-01" ? sport.endDate : endDate,
            id: sport.id || sport._id || normalizedKey,
            key: normalizedKey,
            times: Array.isArray(sport?.times) && sport.times.length > 0
              ? sport.times
              : [...(sportsTimeData[normalizedKey] || [])],
          },
        ];
      })
    );
  }
  return Object.fromEntries(
    Object.entries(sports || {}).map(([key, sport]) => {
      const normalizedKey = sport?.key || (isNaN(Number(key)) ? key : (sport?.title ? slugify(sport.title) : key)) || slugify(sport?.title || "sport");
      const { startDate, endDate } = resolveItemDates(sport);
      return [
        normalizedKey,
        {
          ...sport,
          startDate: sport.startDate || startDate,
          endDate: sport.endDate && sport.endDate >= "2026-10-01" ? sport.endDate : endDate,
          id: sport.id || sport._id || normalizedKey,
          key: normalizedKey,
          times: Array.isArray(sport?.times) && sport.times.length > 0
            ? sport.times
            : [...(sportsTimeData[normalizedKey] || [])],
        },
      ];
    })
  );
}

function omitId(record) {
  if (!record) return record;
  const { id: _unusedId, _id: _unusedMongoId, ...rest } = record;
  void _unusedId;
  void _unusedMongoId;
  return rest;
}

async function persistArrayCollection({
  storageKey,
  previousItems,
  nextItems,
  normalizeFn,
  createApi,
  updateApi,
  deleteApi,
  reportApiErrors = false,
}) {
  const normalizedPrevious = normalizeFn(previousItems);
  const normalizedNext = normalizeFn(nextItems);
  const previousById = new Map(normalizedPrevious.map((item) => [item.id, item]));
  const nextById = new Map(normalizedNext.map((item) => [item.id, item]));

  const creates = normalizedNext.filter((item) => !previousById.has(item.id));
  const updates = normalizedNext.filter((item) => previousById.has(item.id));
  const deletes = normalizedPrevious.filter((item) => !nextById.has(item.id));

  try {
    const createdResponses = await Promise.allSettled(creates.map((item) => createApi(omitId(item))));
    const updateResponses = await Promise.allSettled(
      updates.map((item) => {
        const previousItem = previousById.get(item.id);
        const backendId = previousItem?._id || (isMongoId(previousItem?.id) ? previousItem.id : null);
        if (!backendId) {
          return reportApiErrors
            ? Promise.reject(new Error(`Cannot update "${item.title || item.id}" because its backend ID is missing.`))
            : Promise.resolve(item);
        }
        return updateApi(backendId, omitId(item));
      })
    );
    const deleteResponses = await Promise.allSettled(
      deletes.map((item) => {
        const backendId = item?._id || (isMongoId(item?.id) ? item.id : null);
        if (!backendId) return Promise.resolve({ ok: true });
        return deleteApi(backendId);
      })
    );

    if (reportApiErrors) {
      const failures = [...createdResponses, ...updateResponses, ...deleteResponses]
        .filter((result) => result.status === "rejected");
      if (failures.length > 0) {
        throw failures[0].reason;
      }
    }

    const createdById = new Map();
    createdResponses.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        const item = creates[index];
        createdById.set(item.id, result.value);
      }
    });

    const persistedItems = normalizedNext.map((item) => {
      const createdItem = createdById.get(item.id);
      if (createdItem) {
        return { ...item, _id: createdItem._id || createdItem.id || item._id, id: createdItem.id || item.id };
      }
      return item;
    });

    saveStoredData(storageKey, persistedItems);
    return persistedItems;
  } catch (error) {
    console.warn("Backend persistence failed:", error.message);
    if (reportApiErrors) throw error;
    saveStoredData(storageKey, normalizedNext);
    return normalizedNext;
  }
}

async function persistObjectCollection({
  storageKey,
  previousItems,
  nextItems,
  normalizeFn,
  createApi,
  updateApi,
  deleteApi,
}) {
  const normalizedPrevious = Object.entries(normalizeFn(previousItems) || {}).map(([key, value]) => ({ key, ...value }));
  const normalizedNext = Object.entries(normalizeFn(nextItems) || {}).map(([key, value]) => ({ key, ...value }));
  const previousById = new Map(normalizedPrevious.map((item) => [item.key, item]));
  const nextById = new Map(normalizedNext.map((item) => [item.key, item]));

  const creates = normalizedNext.filter((item) => !previousById.has(item.key));
  const updates = normalizedNext.filter((item) => previousById.has(item.key));
  const deletes = normalizedPrevious.filter((item) => !nextById.has(item.key));

  try {
    const createdResponses = await Promise.allSettled(creates.map((item) => createApi(omitId(item))));
    await Promise.allSettled(
      updates.map((item) => {
        const previousItem = previousById.get(item.key);
        const backendId = previousItem?._id || (isMongoId(previousItem?.id) ? previousItem.id : null);
        if (!backendId) return Promise.resolve(item);
        return updateApi(backendId, omitId(item));
      })
    );
    await Promise.allSettled(
      deletes.map((item) => {
        const backendId = item?._id || (isMongoId(item?.id) ? item.id : null);
        if (!backendId) return Promise.resolve({ ok: true });
        return deleteApi(backendId);
      })
    );

    const createdByKey = new Map();
    createdResponses.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        const item = creates[index];
        createdByKey.set(item.key, result.value);
      }
    });

    const persistedEntries = normalizedNext.map((item) => {
      const createdItem = createdByKey.get(item.key);
      if (createdItem) {
        return { ...item, _id: createdItem._id || createdItem.id || item._id, key: createdItem.key || item.key };
      }
      return item;
    });

    const persistedObject = Object.fromEntries(persistedEntries.map((item) => [item.key, omitId(item)]));
    saveStoredData(storageKey, persistedObject);
    return persistedObject;
  } catch (error) {
    console.warn("Backend persistence failed:", error.message);
    saveStoredData(storageKey, normalizeFn(nextItems));
    return normalizeFn(nextItems);
  }
}

export function getStoredEvents() {
  return normalizeEvents(getStoredData(EVENTS_STORAGE_KEY, eventsData));
}

export function saveEvents(events) {
  const previous = getStoredData(EVENTS_STORAGE_KEY, eventsData);
  return persistArrayCollection({
    storageKey: EVENTS_STORAGE_KEY,
    previousItems: previous,
    nextItems: events,
    normalizeFn: normalizeEvents,
    createApi: createEventApi,
    updateApi: updateEventApi,
    deleteApi: deleteEventApi,
    reportApiErrors: true,
  });
}

export function getStoredMovies() {
  return normalizeMovies(getStoredData(MOVIES_STORAGE_KEY, moviesData));
}

export function saveMovies(movies) {
  const previous = getStoredData(MOVIES_STORAGE_KEY, moviesData);
  return persistArrayCollection({
    storageKey: MOVIES_STORAGE_KEY,
    previousItems: previous,
    nextItems: movies,
    normalizeFn: normalizeMovies,
    createApi: createMovieApi,
    updateApi: updateMovieApi,
    deleteApi: deleteMovieApi,
  });
}

export function getStoredSports() {
  return normalizeSports(getStoredData(SPORTS_STORAGE_KEY, sportsData));
}

export function saveSports(sports) {
  const previous = getStoredData(SPORTS_STORAGE_KEY, sportsData);
  return persistObjectCollection({
    storageKey: SPORTS_STORAGE_KEY,
    previousItems: previous,
    nextItems: sports,
    normalizeFn: normalizeSports,
    createApi: createSportApi,
    updateApi: updateSportApi,
    deleteApi: deleteSportApi,
  });
}

export function getStoredActivities() {
  return normalizeActivities(getStoredData(ACTIVITIES_STORAGE_KEY, activitiesData));
}

export function saveActivities(activities) {
  const previous = getStoredData(ACTIVITIES_STORAGE_KEY, activitiesData);
  return persistArrayCollection({
    storageKey: ACTIVITIES_STORAGE_KEY,
    previousItems: previous,
    nextItems: activities,
    normalizeFn: normalizeActivities,
    createApi: createActivityApi,
    updateApi: updateActivityApi,
    deleteApi: deleteActivityApi,
  });
}

export async function initializeAdminData() {
  if (!isBrowser()) return;

  const loadFromApi = async (getter, storageKey, fallbackData, normalizeFn) => {
    try {
      const data = await getter();
      const rawList = Array.isArray(data)
        ? data
        : data?.data && Array.isArray(data.data)
        ? data.data
        : null;

      if (rawList) {
        const normalized = normalizeFn(rawList);
        saveStoredData(storageKey, normalized);
        return normalized;
      }

      return getStoredData(storageKey, fallbackData);
    } catch {
      return getStoredData(storageKey, fallbackData);
    }
  };

  try {
    await Promise.all([
      loadFromApi(getMoviesApi, MOVIES_STORAGE_KEY, normalizeMovies(moviesData), normalizeMovies),
      loadFromApi(getEventsApi, EVENTS_STORAGE_KEY, normalizeEvents(eventsData), normalizeEvents),
      loadFromApi(getSportsApi, SPORTS_STORAGE_KEY, normalizeSports(sportsData), normalizeSports),
      loadFromApi(getActivitiesApi, ACTIVITIES_STORAGE_KEY, normalizeActivities(activitiesData), normalizeActivities),
      loadFromApi(getUsersApi, "bookmyshow_users", [], normalizeUsers).then(saveUsers),
    ]);
  } catch {
    return;
  }
}
