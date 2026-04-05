import express from "express";
import { assignDriverToTruck, assignRoute, createTruck, emptyTruck, getAvailableTrucks, getTruckById, getTruckHistory, getTruckLoad, getTrucks, updateTruck, updateTruckLocation } from "../controllers/truckController.js";

const router = express.Router();

router.post("/", createTruck);
router.get("/", getTrucks);
router.get("/available", getAvailableTrucks);
router.get("/:id", getTruckById);
router.post("/:id", updateTruck);
router.post("/:id/location", updateTruckLocation);
router.get("/:id/history", getTruckHistory);
router.post("/truck/:id/empty", emptyTruck);
router.post("/:id/route", assignRoute);
router.get("/:id/load", getTruckLoad);
router.post("/:id/assign-driver", assignDriverToTruck);

export default router;