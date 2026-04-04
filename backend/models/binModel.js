import mongoose from "mongoose";

const binSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: true,
      unique: true
    },

    location: {
      lat: Number,
      lng: Number
    },

    landmark: String,

    address: String,
    area: String,

    fillLevel: {
      type: Number,
      default: 0
    },

    capacity: {
      type: Number,
      required: true
    },

    currentLoad: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["EMPTY", "MEDIUM", "FULL","ACTIVE","INACTIVE"],
      default: "EMPTY"
    },

    assignedTruck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck"
    },

    lastCollectedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Bin", binSchema);