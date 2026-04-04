import express from "express";
import { assignRoute, createTruck, emptyTruck, getTruckById, getTruckHistory, getTrucks, updateTruck, updateTruckLocation } from "../controllers/truckController.js";

const router = express.Router();

router.post("/", createTruck);
router.get("/", getTrucks);
router.get("/:id", getTruckById);
router.post("/:id", updateTruck);
router.post("/:id/location", updateTruckLocation);
router.get("/:id/history", getTruckHistory);
router.post("/truck/:id/empty", emptyTruck);
router.post("/:id/route", assignRoute);

export default router;