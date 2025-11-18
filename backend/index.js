import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import channelRoutes from "./routes/channels.js";
import mlRoutes from "./routes/ml.js";
import orgRoutes from "./routes/organizations.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;


//middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Linguashift API running" });
});
 
//API endpoints
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/organizations", orgRoutes);

//connect to MongoDB
async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();