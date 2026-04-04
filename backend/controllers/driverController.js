import Driver from "../models/driverModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Token
const generateToken = (id) => {
  return jwt.sign({ id, role: "driver" }, "secretkey", {
    expiresIn: "7d"
  });
};

// 🟢 Register Driver
export const registerDriver = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    gender,
    licenseNumber,
    age,
    startDate
  } = req.body;

  const exists = await Driver.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "Driver exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const driver = await Driver.create({
    name,
    email,
    password: hashed,
    phone,
    gender,
    licenseNumber,
    age,
    startDate
  });

  res.json({
    _id: driver._id,
    token: generateToken(driver._id)
  });
};

// 🔐 Login Driver
export const loginDriver = async (req, res) => {
  const { email, password } = req.body;

  const driver = await Driver.findOne({ email });

  if (driver && (await bcrypt.compare(password, driver.password))) {
    res.json({
      _id: driver._id,
      token: generateToken(driver._id)
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

export const getDriverNotifications = async (req, res) => {
    const notifications = await Notification.find({
      driver: req.user.id
    });
  
    res.json(notifications);
  };