import mongoose from "mongoose";

const truckLocationSchema = new mongoose.Schema(
  {
    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck"
    },
    location: {
      lat: Number,
      lng: Number
    }
  },
  { timestamps: true }
);

export default mongoose.model("TruckLocation", truckLocationSchema);