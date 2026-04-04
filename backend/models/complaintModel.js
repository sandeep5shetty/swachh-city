import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    image: {
      type: String
    },

    location: {
      lat: Number,
      lng: Number
    },

    address: String, 

    description: String,

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW"
    },

    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "RESOLVED"],
      default: "PENDING"
    },

    issueType: String,

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    remarks: String, 

    responseImage: String // proof after cleaning
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);