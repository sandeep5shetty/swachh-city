import express from "express";
import { createTruck, emptyTruck, getTruckById, getTruckHistory, getTrucks, updateTruck, updateTruckLocation } from "../controllers/truckController.js";

const router = express.Router();

router.post("/", createTruck);
router.get("/", getTrucks);
router.get("/:id", getTruckById);
router.post("/:id", updateTruck);
router.put("/:id/location", updateTruckLocation);
router.get("/:id/history", getTruckHistory);
router.post("/truck/:id/empty", emptyTruck);


export default router;