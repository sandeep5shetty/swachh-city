import express from "express";
import { getCollectionStats, getDashboardStats, getTodayStats } from "../controllers/statsController.js";

const router = express.Router();

router.get("/", getDashboardStats); 
router.get("/collection", getCollectionStats);
router.get("/today", getTodayStats);

export default router;