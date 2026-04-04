import express from "express";
import { collectBin, createBin, getBins, getCollectionHistory, updateBin } from "../controllers/binController.js";

const router = express.Router();

router.post("/", createBin);
router.get("/", getBins);
router.post("/:id", updateBin);
router.post("/:id/collect", collectBin);
router.get("/collections/history", getCollectionHistory);

export default router;