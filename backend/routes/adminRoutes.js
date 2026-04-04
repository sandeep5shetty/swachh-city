import express from "express";
import {
  getAllComplaints,
  updateComplaintStatus
} from "../controllers/adminController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { loginUser } from "../controllers/userController.js";
import { deleteComplaint, updateComplaint } from "../controllers/complaintController.js";
import { createBin, getBins } from "../controllers/binController.js";
import { createTruck, getTruckById, getTruckHistory, getTruckHistoryByDate, getTrucks } from "../controllers/truckController.js";

const router = express.Router();

router.post("/login", loginUser);

router.get("/complaints", protect, adminOnly, getAllComplaints);

router.post("/bins", protect, adminOnly, createBin);
router.get("/bins", protect, adminOnly, getBins);

router.post("/trucks", protect, adminOnly, createTruck);
router.get("/trucks", protect, adminOnly, getTrucks);
router.get("/trucks/:id", protect, adminOnly, getTruckById);

router.get("/truckhistory/:id", protect, adminOnly, getTruckHistory);
router.get("/truckhistorydate/:id", protect, adminOnly, getTruckHistoryByDate);

router.put("/complaints/:id", protect, adminOnly, updateComplaint);

router.put("/complaints/:id/respond", protect, adminOnly, updateComplaintStatus);

router.delete("/complaints/:id", protect, adminOnly, deleteComplaint);

export default router;