import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import binRoutes from "./routes/binRoutes.js";
import truckRoutes from "./routes/truckRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/bins", binRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/complaints", complaintRoutes);

// DB + Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });

  })
  .catch((err) => console.log(err));