import mongoose from "mongoose";

const cinemaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true, index: true },
    area: { type: String },
    address: { type: String },
    screens: { type: Number, default: 4 },
    facilities: [{ type: String }],
    showtimes: [{ type: String }],
    pricing: {
      platinum: { type: Number, default: 350 },
      gold: { type: Number, default: 250 },
      silver: { type: Number, default: 180 },
    },
  },
  { timestamps: true }
);

export const Cinema = mongoose.model("Cinema", cinemaSchema);
