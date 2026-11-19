import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    userName: { type: String, default: "Moviegoer" },
    userEmail: { type: String, default: "" },
    userAvatar: { type: String, default: "" },
    itemId: { type: String, required: true },
    itemTitle: { type: String, default: "Entertainment Item" },
    itemType: { type: String, default: "Movie" }, // 'Movie', 'Event', 'Sport', 'Activity'
    ticketId: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    comment: { type: String, required: true },
    status: { type: String, enum: ["Approved", "Pending", "Flagged"], default: "Approved" },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
