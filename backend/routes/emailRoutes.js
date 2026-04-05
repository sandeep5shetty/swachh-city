import express from "express";
import { sendDriverAlertEmail } from "../controllers/emailController.js";

const router = express.Router();

router.post("/driver-alert", sendDriverAlertEmail);

export default router;
