import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  image: { type: String },
  role: { type: String, enum: ["user", "trainer", "admin"], default: "user" },
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  trainerApplicationStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
  trainerFeedback: { type: String },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
