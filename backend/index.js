import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import binRoutes from "./routes/binRoutes.js";
import truckRoutes from "./routes/truckRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.json("🚀 Welcome to Smart Garbage Management Backend API");
});

app.use("/api/stats", statsRoutes);

app.use("/api/bins", binRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/complaints", complaintRoutes);

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });

  })
  .catch((err) => console.log(err));