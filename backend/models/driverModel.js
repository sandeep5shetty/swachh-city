import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true
    },
    password: String,

    phone: String,
    gender: String,

    licenseNumber: String,
    age: Number,
    startDate: Date,

    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Driver", driverSchema);