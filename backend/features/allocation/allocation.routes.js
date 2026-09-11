import express from "express";
import {
  assignProject,
  getAssignmentByProject,
  getMyAssignments,
  getAllAssignments,
  reassignProject,
  cleanupExpiredAssignments,
  getAllocationStatus,
} from "./allocation.controller.js";
import protect from "../../middleware/auth.js";
import allowRoles from "../../middleware/roleCheck.js";

const router = express.Router();

router.post("/assign/:projectId", protect, allowRoles("client"), assignProject);
router.get("/project/:projectId", protect, getAssignmentByProject);
router.get("/my", protect, allowRoles("freelancer"), getMyAssignments);
router.get("/all", protect, allowRoles("admin"), getAllAssignments);
router.get("/status/:jobId", protect, allowRoles("client"), getAllocationStatus);
router.put("/reassign/:assignmentId", protect, allowRoles("admin"), reassignProject);
router.post("/cleanup", protect, allowRoles("admin"), cleanupExpiredAssignments);

export default router;