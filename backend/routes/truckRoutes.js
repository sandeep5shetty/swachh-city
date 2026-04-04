import express from "express";
import { createTruck, getTrucks, updateTruckLocation } from "../controllers/truckController.js";

const router = express.Router();

router.post("/", createTruck);
router.get("/", getTrucks);
router.put("/:id/location", updateTruckLocation);

export default router;