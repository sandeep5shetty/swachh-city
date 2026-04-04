import Complaint from "../models/complaintModel.js";
import Bin from "../models/binModel.js";
import Truck from "../models/truckModel.js";

//  GET ALL COMPLAINTS
export const getAllComplaints = async (req, res) => {
  const complaints = await Complaint.find().populate("user", "name email");
  res.json(complaints);
};

// //  CREATE BIN
// export const createBin = async (req, res) => {
//   const bin = await Bin.create(req.body);
//   res.json(bin);
// };

// //  CREATE TRUCK
// export const createTruck = async (req, res) => {
//   const truck = await Truck.create(req.body);
//   res.json(truck);
// };

// //  GET ALL BINS
// export const getBins = async (req, res) => {
//   const bins = await Bin.find();
//   res.json(bins);
// };

// //  GET ALL TRUCKS
// export const getTrucks = async (req, res) => {
//   const trucks = await Truck.find();
//   res.json(trucks);
// };
export const updateComplaintStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint || complaint.status === "DELETED") {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const { status } = req.body;

    const allowed = ["PENDING", "IN_PROGRESS", "RESOLVED"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }

    complaint.status = status;

    const updated = await complaint.save();

    res.json({
      message: "Complaint status updated",
      data: updated
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};