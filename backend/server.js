import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./features/auth/auth.routes.js";
import freelancerRoutes from "./features/freelancer/freelancer.routes.js";
import projectRoutes from "./features/project/project.routes.js";
import allocationRoutes from "./features/allocation/allocation.routes.js";
import notificationRoutes from "./features/notification/notification.routes.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/freelancer", freelancerRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/allocation", allocationRoutes);
app.use("/api/notification", notificationRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Smart Allocator API running" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));