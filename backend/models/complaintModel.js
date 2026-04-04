import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema({
  image: String,
  location: {
    lat: Number,
    lng: Number
  },
  issueType: String
}, { timestamps: true });

export default mongoose.model("Complaint", complaintSchema);