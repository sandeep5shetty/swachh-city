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

//  CREATE COMPLAINT
export const createComplaint = async (req, res) => {
  const complaint = await Complaint.create({
    ...req.body,
    user: req.user.id
  });

  res.json(complaint);
};

//  GET MY COMPLAINTS
export const getMyComplaints = async (req, res) => {
  const complaints = await Complaint.find({ user: req.user.id });
  res.json(complaints);
};