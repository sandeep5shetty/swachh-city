import express from "express";
import {
  registerUser,
  loginUser,
  createComplaint,
  getMyComplaints
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/complaint", protect, createComplaint);
router.get("/my-complaints", protect, getMyComplaints);

export default router;