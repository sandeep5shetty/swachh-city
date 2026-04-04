import express from "express";
import { createBin, getBins, updateBin } from "../controllers/binController.js";

const router = express.Router();

router.post("/", createBin);
router.get("/", getBins);
router.put("/:id", updateBin);

export default router;