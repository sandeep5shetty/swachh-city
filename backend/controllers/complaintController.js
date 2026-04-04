import Complaint from "../models/complaintModel.js";

export const createComplaint = async (req, res) => {
  const complaint = await Complaint.create(req.body);
  res.status(201).json(complaint);
};

export const getComplaints = async (req, res) => {
  const complaints = await Complaint.find();
  res.json(complaints);
};

export const getComplaintById = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  res.json(complaint);
};

export const deleteComplaint = async (req, res) => {
  await Complaint.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};