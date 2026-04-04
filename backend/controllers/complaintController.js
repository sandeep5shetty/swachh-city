import Complaint from "../models/complaintModel.js";


// 🧾 CREATE COMPLAINT
export const createComplaint = async (req, res) => {
  try {
    const {
      image,
      location,
      address,
      description,
      severity,
      issueType
    } = req.body;

    if (!location || !description) {
      return res.status(400).json({
        message: "Location and description are required"
      });
    }

    const complaint = await Complaint.create({
      image,
      location,
      address,
      description,
      severity,
      issueType,
      user: req.user?.id // optional (if auth used)
    });

    res.status(201).json({
      message: "Complaint created successfully",
      data: complaint
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 📄 GET ALL COMPLAINTS (Admin)
export const getComplaints = async (req, res) => {
  try {
    const { status, severity } = req.query;

    let filter = {
      status: { $ne: "DELETED" } // hide soft deleted
    };

    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const complaints = await Complaint.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({
      count: complaints.length,
      data: complaints
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 📄 GET COMPLAINT BY ID
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("user", "name email");

    if (!complaint || complaint.status === "DELETED") {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json(complaint);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 🗑️ SOFT DELETE (Admin)
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = "DELETED";
    await complaint.save();

    res.json({ message: "Complaint deleted (soft)" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const updateComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint || complaint.status === "DELETED") {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const {
      image,
      location,
      address,
      description,
      severity,
      issueType
    } = req.body;

    // Update only if provided
    if (image) complaint.image = image;
    if (location) complaint.location = location;
    if (address) complaint.address = address;
    if (description) complaint.description = description;
    if (severity) complaint.severity = severity;
    if (issueType) complaint.issueType = issueType;

    const updated = await complaint.save();

    res.json({
      message: "Complaint updated successfully",
      data: updated
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const linkComplaintToBin = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const bin = await Bin.findOne({
      status: { $ne: "INACTIVE" }
    });

    complaint.bin = bin?._id;
    await complaint.save();

    res.json({ message: "Complaint linked to bin", bin });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};