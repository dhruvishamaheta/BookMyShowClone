import mongoose from "mongoose";

const bookedSeatSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, required: true },
    date: { type: String, default: "" },
    showtime: { type: String, default: "" },
    venue: { type: String, default: "" },
    seats: { type: [String], default: [] },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    poster: { type: String, required: true },
    rating: Number,
    duration: String,
    genre: String,
    language: String,
    format: { type: String, default: "2D" },
    description: String,
    releaseDate: String,
    location: String,
    cinema: String,
    showtimes: [{ name: String, times: [String] }],
    bookedSeats: { type: [bookedSeatSchema], default: [] },
  },
  { timestamps: true }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    poster: { type: String, required: true },
    category: String,
    type: String,
    venue: String,
    date: String,
    startDate: String,
    endDate: String,
    bookingEndDate: String,
    price: Number,
    rating: Number,
    language: String,
    description: String,
    showtimes: [{ time: String, venue: String }],
    bookedSeats: { type: [bookedSeatSchema], default: [] },
  },
  { timestamps: true }
);

const sportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    poster: { type: String, required: true },
    venue: String,
    date: String,
    desc: String,
    description: String,
    price: Number,
    rating: Number,
    language: String,
    category: String,
    times: [String],
    key: { type: String, required: true, unique: true },
    bookedSeats: { type: [bookedSeatSchema], default: [] },
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    poster: { type: String, required: true },
    location: String,
    time: String,
    price: Number,
    rating: Number,
    category: String,
    language: String,
    description: String,
  },
  { timestamps: true }
);

export const Movie = mongoose.model("Movie", movieSchema);
export const Event = mongoose.model("Event", eventSchema);
export const Sport = mongoose.model("Sport", sportSchema);
export const Activity = mongoose.model("Activity", activitySchema);
