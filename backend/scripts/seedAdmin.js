import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../features/auth/auth.model.js";
import connectDB from "../config/db.js";

dotenv.config();

const seedAdmin = async () => {
  await connectDB();

  const existing = await User.findOne({ email: "admin@smartallocator.com" });

  if (existing) {
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  const admin = await User.create({
    name: "Admin",
    email: "admin@smartallocator.com",
    password: "admin123456",
    role: "admin",
  });

  console.log("Admin created successfully:");
  console.log("  Email   :", admin.email);
  console.log("  Password: admin123456");
  console.log("  Role    :", admin.role);

  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error("Seeder error:", err.message);
  process.exit(1);
});