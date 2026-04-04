import mongoose from "mongoose";

const truckSchema = new mongoose.Schema({
  driverName: String,
  currentLocation: {
    lat: Number,
    lng: Number
  },
  capacity: Number,
  status: {
    type: String,
    enum: ["IDLE", "BUSY"],
    default: "IDLE"
  }
}, { timestamps: true });

export default mongoose.model("Truck", truckSchema);