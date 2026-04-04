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
    route: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bin"
      }
    ],
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver"
    },
    status: {
      type: String,
      enum: ["IDLE", "BUSY", "MAINTENANCE", "OFFLINE","ENROUTE", "RETURNING","COLLECTING"],
      default: "IDLE"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Truck", truckSchema);