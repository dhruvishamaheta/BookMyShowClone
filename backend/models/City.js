import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    state: { type: String },
    popular: { type: Boolean, default: false },
    slug: { type: String },
  },
  { timestamps: true }
);

export const City = mongoose.model("City", citySchema);
