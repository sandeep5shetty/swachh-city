import User from "../models/userModel.js";
import Complaint from "../models/complaintModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (data) => {
  return jwt.sign(data, "secretkey", { expiresIn: "7d" });
};

//  REGISTER
export const registerUser = async (req, res) => {
  const { name, email, password, phone, gender, address } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User exists" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
    phone,
    gender,
    address
  });

  res.json({
    id: user._id,
    role: "citizen",
    token: generateToken({ id: user._id, role: "citizen" })
  });
};

//  LOGIN (User + Admin)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  //  Admin Login
  if (email === "admin@swachh.city" && password === "admin123") {
    return res.json({
      role: "admin",
      token: generateToken({ role: "admin" })
    });
  }

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      id: user._id,
      role: "citizen",
      token: generateToken({ id: user._id, role: "citizen" })
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

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
      user: req.user.id,
      status: "PENDING"
    });

    res.status(201).json({
      message: "Complaint submitted successfully",
      data: complaint
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyComplaints = async (req, res) => {
  try {
    const { status, severity } = req.query;

    let filter = {
      user: req.user.id,
      status: { $ne: "DELETED" } 
    };

    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      count: complaints.length,
      data: complaints
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};