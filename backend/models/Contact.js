import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, default: "" },
    subject: { type: String, default: "General Inquiry" },
    message: { type: String, required: true },
    status: { type: String, default: "New", enum: ["New", "In Review", "Resolved"] },
  },
  { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
