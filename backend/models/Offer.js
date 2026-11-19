import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["Festive Offer", "Last Minute Offer", "Special Deal", "Bank Offer", "Promo Code"],
      default: "Festive Offer",
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      default: "percentage",
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 200,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 200,
      min: 0,
    },
    applicableFor: {
      type: String,
      enum: ["All", "Movie", "Event", "Sport", "Activity"],
      default: "All",
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    badgeText: {
      type: String,
      default: "FESTIVE SPECIAL",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    terms: {
      type: [String],
      default: [
        "Valid on select movie, event, and sports bookings.",
        "Cannot be combined with other promotional offers.",
        "Discount is calculated on base ticket price.",
      ],
    },
  },
  { timestamps: true }
);

export const Offer = mongoose.model("Offer", offerSchema);
