import { createBookingApi } from "./authApi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || "Payment request failed.");
  }
  return payload;
}

export function createPaymentOrder({ amount, receipt, bookingType }) {
  return request("/payments/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      receipt,
      bookingType,
    }),
  });
}

export function verifyPayment(payment) {
  return request("/payments/verify", {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

export function saveVerifiedBooking(booking, userId) {
  return createBookingApi(booking, userId);
}
