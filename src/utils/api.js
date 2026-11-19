const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload;
}

export function loginAdminApi(credentials) {
  return request("/admin/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getMoviesApi() {
  return request("/movies");
}

export function createMovieApi(movie) {
  return request("/movies", {
    method: "POST",
    body: JSON.stringify(movie),
  });
}

export function updateMovieApi(id, movie) {
  return request(`/movies/${id}`, {
    method: "PUT",
    body: JSON.stringify(movie),
  });
}

export function deleteMovieApi(id) {
  return request(`/movies/${id}`, {
    method: "DELETE",
  });
}

export function getEventsApi() {
  return request("/events");
}

export function createEventApi(event) {
  return request("/events", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export function updateEventApi(id, event) {
  return request(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(event),
  });
}

export function deleteEventApi(id) {
  return request(`/events/${id}`, {
    method: "DELETE",
  });
}

export function getSportsApi() {
  return request("/sports");
}

export function createSportApi(sport) {
  return request("/sports", {
    method: "POST",
    body: JSON.stringify(sport),
  });
}

export function updateSportApi(id, sport) {
  return request(`/sports/${id}`, {
    method: "PUT",
    body: JSON.stringify(sport),
  });
}

export function deleteSportApi(id) {
  return request(`/sports/${id}`, {
    method: "DELETE",
  });
}

export function getActivitiesApi() {
  return request("/activities");
}

export function createActivityApi(activity) {
  return request("/activities", {
    method: "POST",
    body: JSON.stringify(activity),
  });
}

export function updateActivityApi(id, activity) {
  return request(`/activities/${id}`, {
    method: "PUT",
    body: JSON.stringify(activity),
  });
}

export function deleteActivityApi(id) {
  return request(`/activities/${id}`, {
    method: "DELETE",
  });
}

export function getCitiesApi(q) {
  const path = q ? `/cities?q=${encodeURIComponent(q)}` : "/cities";
  return request(path);
}

export function getPopularCitiesApi() {
  return request("/cities/popular");
}

export function getCinemasApi(city) {
  const path = city ? `/cinemas?city=${encodeURIComponent(city)}` : "/cinemas";
  return request(path);
}

export function getMovieShowtimesApi(movieId, city) {
  const path = city
    ? `/movies/${encodeURIComponent(movieId)}/showtimes?city=${encodeURIComponent(city)}`
    : `/movies/${encodeURIComponent(movieId)}/showtimes`;
  return request(path);
}

export function getSeatAvailabilityApi({ type, itemId, title, date, showtime, venue }) {
  const params = new URLSearchParams({ type, title, date, showtime });
  if (itemId) params.set("itemId", itemId);
  if (venue) params.set("venue", venue);
  return request(`/seats/availability?${params.toString()}`);
}

export function searchApi(query) {
  const path = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
  return request(path);
}

// Filter functions
export function filterMoviesApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.language) params.append("language", filters.language);
  if (filters.genre) params.append("genre", filters.genre);
  const queryString = params.toString() ? `?${params.toString()}` : "";
  return request(`/movies/filter${queryString}`);
}

export function filterEventsApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.language) params.append("language", filters.language);
  if (filters.category) params.append("category", filters.category);
  const queryString = params.toString() ? `?${params.toString()}` : "";
  return request(`/events/filter${queryString}`);
}

export function filterSportsApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.language) params.append("language", filters.language);
  const queryString = params.toString() ? `?${params.toString()}` : "";
  return request(`/sports/filter${queryString}`);
}

export function filterActivitiesApi(filters = {}) {
  const params = new URLSearchParams();
  if (filters.language) params.append("language", filters.language);
  if (filters.category) params.append("category", filters.category);
  const queryString = params.toString() ? `?${params.toString()}` : "";
  return request(`/activities/filter${queryString}`);
}

export function getReviewsApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.itemId) searchParams.append("itemId", params.itemId);
  if (params.itemType) searchParams.append("itemType", params.itemType);
  if (params.userId) searchParams.append("userId", params.userId);
  if (params.status) searchParams.append("status", params.status);
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return request(`/reviews${qs}`);
}

export function createReviewApi(review) {
  return request("/reviews", {
    method: "POST",
    body: JSON.stringify(review),
  });
}

export function updateReviewApi(id, review) {
  return request(`/reviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(review),
  });
}

export function deleteReviewApi(id) {
  return request(`/reviews/${id}`, {
    method: "DELETE",
  });
}

// Offers & Discounts API
export function getOffersApi(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.append("category", params.category);
  if (params.type) searchParams.append("type", params.type);
  const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return request(`/offers${qs}`);
}

export function getAdminOffersApi() {
  return request("/admin/offers");
}

export function createOfferApi(offer) {
  return request("/admin/offers", {
    method: "POST",
    body: JSON.stringify(offer),
  });
}

export function updateOfferApi(id, offer) {
  return request(`/admin/offers/${id}`, {
    method: "PUT",
    body: JSON.stringify(offer),
  });
}

export function deleteOfferApi(id) {
  return request(`/admin/offers/${id}`, {
    method: "DELETE",
  });
}

// =========================================================
// Gift Cards API
// =========================================================

export function getGiftCardsApi(params = {}) {
  const query = new URLSearchParams();
  if (params.recipientEmail) query.set("recipientEmail", params.recipientEmail);
  if (params.category) query.set("category", params.category);
  const qStr = query.toString();
  return request(`/giftcards${qStr ? `?${qStr}` : ""}`);
}

export function getAdminGiftCardsApi() {
  return request("/admin/giftcards");
}

export function createGiftCardApi(giftCard) {
  return request("/admin/giftcards", {
    method: "POST",
    body: JSON.stringify(giftCard),
  });
}

export function updateGiftCardApi(id, giftCard) {
  return request(`/admin/giftcards/${id}`, {
    method: "PUT",
    body: JSON.stringify(giftCard),
  });
}

export function deleteGiftCardApi(id) {
  return request(`/admin/giftcards/${id}`, {
    method: "DELETE",
  });
}

export function checkGiftCardBalanceApi(data) {
  return request("/giftcards/check-balance", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function applyGiftCardPaymentApi(data) {
  return request("/giftcards/apply", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function validateOfferCodeApi(data) {
  return request("/offers/validate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

