import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    pin: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    recipientEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    recipientUserId: {
      type: String,
      default: "",
    },
    recipientName: {
      type: String,
      trim: true,
      default: "",
    },
    senderName: {
      type: String,
      trim: true,
      default: "BookMyShow Admin",
    },
    message: {
      type: String,
      default: "Enjoy unlimited entertainment with BookMyShow!",
    },
    category: {
      type: String,
      enum: ["Movies", "Festive", "Birthday", "Celebration", "VIP Rewards", "General"],
      default: "Movies",
    },
    themeColor: {
      type: String,
      enum: ["ruby", "gold", "emerald", "indigo", "sunset", "midnight"],
      default: "ruby",
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months default
    },
    status: {
      type: String,
      enum: ["active", "redeemed", "expired", "disabled"],
      default: "active",
    },
    redeemedBy: {
      userId: { type: String, default: null },
      userEmail: { type: String, default: null },
      userName: { type: String, default: null },
      redeemedAt: { type: Date, default: null },
      orderId: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export const GiftCard = mongoose.model("GiftCard", giftCardSchema);

