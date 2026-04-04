import express from "express";
import { assignTruckToBin, collectBin, createBin, getBins, getCollectionHistory, getNearbyBins, updateBin } from "../controllers/binController.js";

const router = express.Router();

router.post("/", createBin);
router.get("/", getBins);
router.post("/:id", updateBin);
router.post("/:id/collect", collectBin);
router.get("/collections/history", getCollectionHistory);
router.get("/nearby", getNearbyBins);
router.post("/:id/assign-truck", assignTruckToBin);

export default router;