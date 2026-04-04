import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    phone: Number,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },
    address: String,
    city: String,
    pincode: String,

    role: {
      type: String,
      default: "citizen" 
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);