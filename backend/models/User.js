import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["member", "admin"], default: "member" },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  department: String,
  title: String,
  audiencePreset: { type: String, default: "PMs" },
  tonePreset: { type: String, default: "Neutral" }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;