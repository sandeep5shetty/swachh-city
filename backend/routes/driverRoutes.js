import express from "express";
import { registerDriver, loginDriver, getDriverNotifications } from "../controllers/driverController.js";

const router = express.Router();

router.post("/register", registerDriver);
router.post("/login", loginDriver);
router.get("/notifications", getDriverNotifications);

export default router;