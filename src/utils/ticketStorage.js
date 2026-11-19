import { deleteBookingApi, getBookingsApi } from "./authApi";
import {
  createReviewApi,
  deleteReviewApi,
  getReviewsApi,
  updateReviewApi,
} from "./api";

const TICKETS_KEY = "bookmyshow_tickets";
const REVIEWS_KEY = "bookmyshow_reviews";
const SEAT_MAP_KEY = "bookmyshow_seat_map";

export function getStoredTickets() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out legacy dummy sample tickets if they were previously written
    const realTickets = parsed.filter(
      (t) => !["BMS-17234901", "BMS-17234902", "BMS-17234903"].includes(t.id)
    );
    return realTickets;
  } catch {
    return [];
  }
}

export function saveTicket(ticket) {
  const tickets = getStoredTickets();
  const normalizedTicket = {
    ...ticket,
    id: ticket.id || `BMS-${Date.now().toString().slice(-6)}`,
    status: ticket.status || "Confirmed",
    createdAt: ticket.createdAt || new Date().toISOString(),
  };
  const updated = [normalizedTicket, ...tickets.filter((t) => t.id !== normalizedTicket.id)];
  localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
  return updated;
}

export function saveTickets(tickets) {
  if (typeof window === "undefined") return tickets;
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  return tickets;
}

export function removeTicket(ticketId) {
  const tickets = getStoredTickets();
  const updated = tickets.filter((ticket) => (ticket.id !== ticketId && ticket._id !== ticketId));
  localStorage.setItem(TICKETS_KEY, JSON.stringify(updated));
  return updated;
}

export function clearTickets() {
  if (typeof window === "undefined") return [];
  localStorage.setItem(TICKETS_KEY, JSON.stringify([]));
  return [];
}

export async function getAllBookingsAdmin() {
  const localTickets = getStoredTickets();
  try {
    const apiBookings = await getBookingsApi();
    if (Array.isArray(apiBookings) && apiBookings.length > 0) {
      // Merge unique
      const localIds = new Set(localTickets.map((t) => t.id || t._id));
      const combined = [...localTickets];
      apiBookings.forEach((ab) => {
        const id = ab.id || ab._id;
        if (id && !localIds.has(id)) {
          combined.push({
            id: id,
            _id: ab._id,
            userId: ab.userId || "user",
            customerName: ab.name || ab.userName || "Customer",
            customerEmail: ab.email || "customer@example.com",
            customerMobile: ab.mobile || "",
            title: ab.movieTitle || ab.title || "Booking",
            type: ab.type || "Movie",
            theatre: ab.theatre || ab.venue || "Main Theatre",
            showtime: ab.showtime || ab.time || "Regular",
            date: ab.date || new Date().toISOString().slice(0, 10),
            seats: Array.isArray(ab.seats) ? ab.seats : [ab.seats].filter(Boolean),
            passes: Array.isArray(ab.passes) ? ab.passes : [],
            amount: ab.totalPrice || ab.amount || 350,
            status: ab.status || "Confirmed",
            createdAt: ab.createdAt || new Date().toISOString(),
          });
        }
      });
      return combined;
    }
  } catch {
    // API not reachable, return local
  }
  return localTickets;
}

export async function deleteBookingAdmin(bookingId) {
  try {
    await deleteBookingApi(bookingId);
  } catch {
    // ignore API error
  }
  return removeTicket(bookingId);
}

export async function clearAllBookingsAdmin() {
  try {
    await clearTickets();
  } catch {
    // ignore
  }
  return [];
}

const DEFAULT_SEED_REVIEWS = {
  m1: [
    {
      id: "rev-m1-1",
      userId: "usr_priya",
      userName: "Priya Sharma",
      userEmail: "priya.sharma@example.com",
      userAvatar: "",
      itemId: "m1",
      itemTitle: "Avengers: Endgame",
      itemType: "Movie",
      rating: 5,
      comment: "Absolute cinematic masterpiece! The IMAX 3D experience was unmatched and the emotional climax was unforgettable.",
      status: "Approved",
      createdAt: "2026-09-20, 08:30 PM",
    },
  ],
  m2: [
    {
      id: "rev-m2-1",
      userId: "usr_vikram",
      userName: "Vikram Singh",
      userEmail: "vikram.singh@example.com",
      userAvatar: "",
      itemId: "m2",
      itemTitle: "Fighter",
      itemType: "Movie",
      rating: 4,
      comment: "Good aerial action sequences and soundtrack. Enjoyed watching it with friends on a big screen.",
      status: "Approved",
      createdAt: "2026-09-18, 07:15 PM",
    },
  ],
  e1: [
    {
      id: "rev-e1-1",
      userId: "usr_rohan",
      userName: "Rohan Patel",
      userEmail: "rohan.patel@example.com",
      userAvatar: "",
      itemId: "e1",
      itemTitle: "Arijit Singh Live in Concert",
      itemType: "Event",
      rating: 5,
      comment: "Pure magic! Arijit Singh performed for 3 straight hours. Sound quality and stage light production were world-class.",
      status: "Approved",
      createdAt: "2026-09-19, 10:45 PM",
    },
  ],
  e2: [
    {
      id: "rev-e2-1",
      userId: "usr_ananya",
      userName: "Ananya Verma",
      userEmail: "ananya.v@example.com",
      userAvatar: "",
      itemId: "e2",
      itemTitle: "Zakir Khan - Tathastu Live",
      itemType: "Event",
      rating: 5,
      comment: "Hilarious and heartwarming! Non-stop laughs from start to finish. Zakir Bhai never disappoints.",
      status: "Approved",
      createdAt: "2026-09-17, 09:20 PM",
    },
  ],
  s1: [
    {
      id: "rev-s1-1",
      userId: "usr_rahul",
      userName: "Rahul Mehta",
      userEmail: "rahul.mehta@example.com",
      userAvatar: "",
      itemId: "s1",
      itemTitle: "IPL 2026 Final - Grand Clash",
      itemType: "Sport",
      rating: 5,
      comment: "Electric stadium vibe! Super thrilled to witness the match live. Smooth entry and great seating view.",
      status: "Approved",
      createdAt: "2026-09-16, 11:10 PM",
    },
  ],
  a1: [
    {
      id: "rev-a1-1",
      userId: "usr_sneha",
      userName: "Sneha Joshi",
      userEmail: "sneha.j@example.com",
      userAvatar: "",
      itemId: "a1",
      itemTitle: "Snow Village & Ice Adventure",
      itemType: "Activity",
      rating: 4,
      comment: "Had an awesome weekend outing with family. Snow slides and ice tubes were super fun for kids and adults alike.",
      status: "Approved",
      createdAt: "2026-09-14, 04:50 PM",
    },
  ],
};

function getRawReviewsMap() {
  if (typeof window === "undefined") return DEFAULT_SEED_REVIEWS;
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(DEFAULT_SEED_REVIEWS));
      return { ...DEFAULT_SEED_REVIEWS };
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : DEFAULT_SEED_REVIEWS;
  } catch {
    return DEFAULT_SEED_REVIEWS;
  }
}

export function getStoredReviews(itemId) {
  if (typeof window === "undefined") return [];
  try {
    const allReviews = getRawReviewsMap();
    return allReviews[itemId] || [];
  } catch {
    return [];
  }
}

export function getAllStoredReviews(itemId) {
  if (typeof window === "undefined") return [];
  try {
    const allReviews = getRawReviewsMap();
    if (!itemId) {
      const list = Object.values(allReviews).flat();
      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return allReviews[itemId] || [];
  } catch {
    return [];
  }
}

export function saveReview(itemId, review) {
  const allReviews = getRawReviewsMap();
  const currentList = allReviews[itemId] || [];
  const normalizedReview = {
    ...review,
    id: review.id || review._id || `rev-${itemId}-${Date.now()}`,
    itemId: String(itemId),
    rating: Number(review.rating) || 5,
    status: review.status || "Approved",
    createdAt: review.createdAt || new Date().toLocaleString(),
  };

  const filtered = currentList.filter(
    (r) =>
      (r.ticketId && review.ticketId ? r.ticketId !== review.ticketId : true) &&
      (r.id && normalizedReview.id ? r.id !== normalizedReview.id : true)
  );

  const reviews = [normalizedReview, ...filtered];
  allReviews[itemId] = reviews;
  if (typeof window !== "undefined") {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
  }

  // Asynchronously send to backend if available
  createReviewApi(normalizedReview).catch(() => {
    // Local storage fallback handled
  });

  return reviews;
}

const TICKET_REVIEWS_KEY = "bookmyshow_ticket_reviews";

export function getTicketReviewsMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TICKET_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTicketReview(ticketId, reviewData) {
  if (typeof window === "undefined") return null;
  try {
    const map = getTicketReviewsMap();
    const formattedDate = new Date().toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const updatedReview = {
      ...reviewData,
      id: reviewData.id || `rev-ticket-${ticketId}`,
      ticketId,
      rating: Number(reviewData.rating) || 5,
      comment: reviewData.comment || "",
      updatedAt: formattedDate,
      createdAt: reviewData.createdAt || formattedDate,
      status: reviewData.status || "Approved",
    };
    map[ticketId] = updatedReview;
    localStorage.setItem(TICKET_REVIEWS_KEY, JSON.stringify(map));

    if (reviewData.itemId) {
      saveReview(reviewData.itemId, updatedReview);
    }
    return map;
  } catch {
    return null;
  }
}

export function deleteTicketReview(ticketId) {
  if (typeof window === "undefined") return {};
  try {
    const map = getTicketReviewsMap();
    const existing = map[ticketId];
    delete map[ticketId];
    localStorage.setItem(TICKET_REVIEWS_KEY, JSON.stringify(map));

    if (existing?.itemId) {
      const allReviews = getRawReviewsMap();
      if (allReviews[existing.itemId]) {
        allReviews[existing.itemId] = allReviews[existing.itemId].filter((r) => r.ticketId !== ticketId);
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function getAllReviewsAdmin() {
  const localList = getAllStoredReviews();
  try {
    const apiReviews = await getReviewsApi();
    if (Array.isArray(apiReviews) && apiReviews.length > 0) {
      const localMap = new Map(localList.map((r) => [r.id || r._id, r]));
      apiReviews.forEach((ar) => {
        const id = ar.id || ar._id;
        if (id) {
          localMap.set(id, {
            ...ar,
            id: id,
            _id: ar._id,
          });
        }
      });
      const combined = Array.from(localMap.values());
      return combined.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
  } catch {
    // API unreachable, use local
  }
  return localList;
}

export async function updateReviewAdmin(reviewId, updateData) {
  const allReviews = getRawReviewsMap();
  let found = false;

  Object.keys(allReviews).forEach((itemId) => {
    allReviews[itemId] = allReviews[itemId].map((r) => {
      if (r.id === reviewId || r._id === reviewId) {
        found = true;
        return { ...r, ...updateData };
      }
      return r;
    });
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
  }

  try {
    await updateReviewApi(reviewId, updateData);
  } catch {
    // Local updated
  }
  return found;
}

export async function deleteReviewAdmin(reviewId) {
  const allReviews = getRawReviewsMap();

  Object.keys(allReviews).forEach((itemId) => {
    allReviews[itemId] = allReviews[itemId].filter((r) => r.id !== reviewId && r._id !== reviewId);
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
  }

  try {
    await deleteReviewApi(reviewId);
  } catch {
    // Local updated
  }
  return true;
}

export function clearStoredReviews() {
  if (typeof window === "undefined") return [];
  localStorage.setItem(REVIEWS_KEY, JSON.stringify({}));
  localStorage.setItem(TICKET_REVIEWS_KEY, JSON.stringify({}));
  return [];
}

export function getStoredSeatMap(storageKey, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(`${SEAT_MAP_KEY}:${storageKey}`);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredSeatMap(storageKey, seatMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${SEAT_MAP_KEY}:${storageKey}`, JSON.stringify(seatMap));
}

export function markSeatsSold(storageKey, selectedSeats) {
  if (typeof window === "undefined") return;
  const current = getStoredSeatMap(storageKey, {});
  const updated = { ...current };
  selectedSeats.forEach((seatId) => {
    if (updated[seatId]) {
      updated[seatId] = { ...updated[seatId], status: "sold" };
    }
  });
  saveStoredSeatMap(storageKey, updated);
}
