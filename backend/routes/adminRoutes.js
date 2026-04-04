import express from "express";
import {
  getAllComplaints,
  createBin,
  createTruck,
  getBins,
  getTrucks
} from "../controllers/adminController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { loginUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/login", loginUser);

router.get("/complaints", protect, adminOnly, getAllComplaints);

router.post("/bins", protect, adminOnly, createBin);
router.get("/bins", protect, adminOnly, getBins);

router.post("/trucks", protect, adminOnly, createTruck);
router.get("/trucks", protect, adminOnly, getTrucks);

export default router;