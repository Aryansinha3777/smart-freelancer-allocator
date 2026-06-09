import express from "express";
import {
  createProject,
  getMyProjects,
  getProjectById,
  getAllProjects,
  updateProjectStatus,
} from "./project.controller.js";
import protect from "../../middleware/auth.js";
import allowRoles from "../../middleware/roleCheck.js";

const router = express.Router();

router.post("/", protect, allowRoles("client"), createProject);
router.get("/my", protect, allowRoles("client"), getMyProjects);
router.get("/all", protect, allowRoles("admin"), getAllProjects);
router.get("/:id", protect, getProjectById);
router.put("/:id/status", protect, allowRoles("freelancer"), updateProjectStatus);

export default router;