import mongoose from "mongoose";

const binSchema = new mongoose.Schema({
  location: {
    lat: Number,
    lng: Number
  },
  fillLevel: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["EMPTY", "MEDIUM", "FULL"],
    default: "EMPTY"
  }
}, { timestamps: true });

export default mongoose.model("Bin", binSchema);