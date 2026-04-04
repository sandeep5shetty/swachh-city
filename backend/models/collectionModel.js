import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    bin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bin",
      required: true
    },

    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
      required: true
    },

    collectedAmount: {
      type: Number, 
      required: true
    },

    location: {
      lat: Number,
      lng: Number
    },

    type: {
        type: String,
        enum: ["COLLECTION", "TRUCK_EMPTY"],
        default: "COLLECTION"
      },

    collectedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Collection", collectionSchema);