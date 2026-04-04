import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    image: String,
    location: {
      lat: Number,
      lng: Number
    },
    issueType: String,

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);