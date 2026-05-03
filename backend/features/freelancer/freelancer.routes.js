import express from "express";
import {
  createProfile,
  getMyProfile,
  updateProfile,
  getAllFreelancers,
} from "./freelancer.controller.js";
import protect from "../../middleware/auth.js";
import allowRoles from "../../middleware/roleCheck.js";

const router = express.Router();

router.post("/profile", protect, allowRoles("freelancer"), createProfile);
router.get("/profile/me", protect, allowRoles("freelancer"), getMyProfile);
router.put("/profile", protect, allowRoles("freelancer"), updateProfile);
router.get("/all", protect, allowRoles("admin", "client"), getAllFreelancers);

export default router;