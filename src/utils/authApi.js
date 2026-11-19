const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}, userId) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "x-user-id": userId } : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = payload?.message || (typeof payload === "string" ? payload : null) || response.statusText || "Request failed";
    throw new Error(message);
  }

  return payload;
}

export function registerUserApi(userData) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function loginUserApi(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function googleAuthApi(googleData) {
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify(googleData),
  });
}

export function mobileLoginApi(mobileData) {
  return request("/auth/mobile-login", {
    method: "POST",
    body: JSON.stringify(mobileData),
  });
}

export function sendMobileOtpApi(mobileData) {
  return request("/auth/send-mobile-otp", {
    method: "POST",
    body: JSON.stringify(mobileData),
  });
}

export function verifyMobileOtpApi(otpData) {
  return request("/auth/verify-mobile-otp", {
    method: "POST",
    body: JSON.stringify(otpData),
  });
}

export function requestPasswordResetApi(emailData) {
  return request("/auth/request-password-reset", {
    method: "POST",
    body: JSON.stringify(emailData),
  });
}

export function resetPasswordApi(passwordData) {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(passwordData),
  });
}

export function sendOtpApi(emailData) {
  return request("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify(emailData),
  });
}

export function verifyOtpApi(otpData) {
  return request("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(otpData),
  });
}

export function sendWelcomeNotificationApi({ name, email, type = "signup" }) {
  return request("/auth/send-welcome", {
    method: "POST",
    body: JSON.stringify({ name, email, type }),
  });
}

export function getCurrentUserApi(userId) {
  return request("/auth/me", {}, userId);
}

export function updateProfileApi(userId, updates) {
  return request("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(updates),
  }, userId);
}

export function getBookingsApi(userId) {
  return request("/bookings", {}, userId);
}

export function cancelBookingApi(bookingId, userId, cancellationToken) {
  return request(
    `/bookings/cancel/${encodeURIComponent(bookingId)}`,
    {
      method: "POST",
      headers: { "x-booking-cancellation-token": cancellationToken },
    },
    userId
  );
}

export function createBookingApi(booking, userId) {
  return request("/bookings", {
    method: "POST",
    body: JSON.stringify(booking),
  }, userId);
}

export function deleteBookingApi(id) {
  return request(`/bookings/${id}`, {
    method: "DELETE",
  });
}

export function clearBookingsApi() {
  return request("/bookings", {
    method: "DELETE",
  });
}

export function getUsersApi() {
  return request("/users");
}

export function createUserApi(userData) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function updateUserByIdApi(id, updates) {
  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function deleteUserApi(id) {
  return request(`/users/${id}`, {
    method: "DELETE",
  });
}

export function clearUsersApi() {
  return request("/users", {
    method: "DELETE",
  });
}
