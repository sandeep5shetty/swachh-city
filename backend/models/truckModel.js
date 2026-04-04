import mongoose from "mongoose";

const truckSchema = new mongoose.Schema(
  {
    driverName: {
      type: String,
      required: true
    },

    regNo: {
      type: String,
      required: true,
      unique: true
    },

    type: {
      type: String,
      enum: ["3-Wheeler", "2-Axle-Mini", "2-Axle-Standard"],
      default: "2-Axle-Mini"
    },

    totalCapacity: {
      type: Number, 
      required: true
    },

    usedCapacity: {
      type: Number,
      default: 0
    },

    currentLocation: {
      lat: Number,
      lng: Number
    },

    status: {
      type: String,
      enum: ["IDLE", "BUSY"],
      default: "IDLE"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Truck", truckSchema);