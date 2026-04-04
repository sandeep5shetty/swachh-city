import express from "express";
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  deleteComplaint
} from "../controllers/complaintController.js";

const router = express.Router();

router.post("/", createComplaint);
router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.delete("/:id", deleteComplaint);

export default router;