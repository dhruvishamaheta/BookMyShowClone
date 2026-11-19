import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, default: "", index: true },
    cancellationTokenHash: { type: String, default: "" },
    userId: { type: String, default: "" },
    title: String,
    movieId: { type: String, default: "" },
    type: String,
    theatre: { type: String, default: "" },
    showtime: { type: String, default: "" },
    poster: { type: String, default: "" },
    seats: [String],
    passes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    amount: Number,
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    status: String,
    cancelledAt: { type: Date, default: null },
    refundStatus: { type: String, default: "" },
    cancellationFee: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    cancelledSeats: { type: [String], default: [] },
    date: String,
    qr: String,
    method: String,
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerMobile: { type: String, default: "" },
    paymentId: { type: String, default: "" },
    paymentOrderId: { type: String, default: "" },
    paymentSignature: { type: String, default: "" },
    details: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
