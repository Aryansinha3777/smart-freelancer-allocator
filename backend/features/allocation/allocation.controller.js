import Project from "../project/project.model.js";
import Freelancer from "../freelancer/freelancer.model.js";
import Assignment from "./allocation.model.js";
import runAllocationEngine from "./allocationEngine.js";
import createNotification from "../notification/notification.service.js";

// @desc    Trigger allocation for a project
// @route   POST /api/allocation/assign/:projectId
// @access  Private (client only)
export const assignProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (project.status !== "pending") {
      return res.status(400).json({
        message: `Project is already ${project.status}`,
      });
    }

    const freelancers = await Freelancer.find({ isAvailable: true });
    const result = runAllocationEngine(project, freelancers);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        reason: result.reason,
        message: result.message,
        suggestions: result.suggestions,
      });
    }

    const assignment = await Assignment.create({
      projectId: project._id,
      freelancerId: result.freelancer._id,
      assignedHours: result.assignedHours,
      schedule: result.schedule,
      estimatedCompletionDate: result.estimatedCompletionDate,
    });

    await Freelancer.findByIdAndUpdate(result.freelancer._id, {
      $inc: { currentLoad: result.assignedHours },
    });

    await Project.findByIdAndUpdate(project._id, { status: "assigned" });

    // Notify the assigned freelancer
    await createNotification({
      userId: result.freelancer.userId,
      message: `You have been assigned a new project: "${project.title}"`,
      type: "assignment",
      projectId: project._id,
    });

    const populated = await Assignment.findById(assignment._id)
      .populate("projectId", "title requiredSkill deadline priority estimatedHours")
      .populate({
        path: "freelancerId",
        populate: { path: "userId", select: "name email" },
      });

    res.status(201).json({ success: true, assignment: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assignment for a specific project
// @route   GET /api/allocation/project/:projectId
// @access  Private
export const getAssignmentByProject = async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      projectId: req.params.projectId,
      status: { $in: ["active", "completed"] },
    })
      .populate("projectId", "title requiredSkill deadline priority status")
      .populate({
        path: "freelancerId",
        populate: { path: "userId", select: "name email" },
      });

    if (!assignment) {
      return res.status(404).json({ message: "No assignment found" });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all assignments for logged in freelancer
// @route   GET /api/allocation/my
// @access  Private (freelancer only)
export const getMyAssignments = async (req, res) => {
  try {
    const freelancerProfile = await Freelancer.findOne({ userId: req.user._id });

    if (!freelancerProfile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    const assignments = await Assignment.find({
      freelancerId: freelancerProfile._id,
      status: "active",
    }).populate(
      "projectId",
      "title requiredSkill deadline priority estimatedHours status"
    );

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all assignments (admin only)
// @route   GET /api/allocation/all
// @access  Private (admin only)
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate(
        "projectId",
        "title requiredSkill deadline priority status estimatedHours"
      )
      .populate({
        path: "freelancerId",
        populate: { path: "userId", select: "name email" },
      })
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reassign a project to next best freelancer
// @route   PUT /api/allocation/reassign/:assignmentId
// @access  Private (admin only)
export const reassignProject = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).populate({
      path: "freelancerId",
      populate: { path: "userId", select: "name email" },
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const project = await Project.findById(assignment.projectId);

    const freelancers = await Freelancer.find({
      isAvailable: true,
      _id: { $ne: assignment.freelancerId._id },
    });

    // Run engine FIRST — before touching anything in DB
    const result = runAllocationEngine(project, freelancers);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.message,
        suggestions: result.suggestions,
      });
    }

    // Engine found someone — safe to modify DB now
    const oldFreelancer = await Freelancer.findById(assignment.freelancerId._id);
    const newLoad = Math.max(0, oldFreelancer.currentLoad - assignment.assignedHours);
    await Freelancer.findByIdAndUpdate(oldFreelancer._id, { currentLoad: newLoad });

    await Assignment.findByIdAndUpdate(assignment._id, { status: "reassigned" });

    const newAssignment = await Assignment.create({
      projectId: project._id,
      freelancerId: result.freelancer._id,
      assignedHours: result.assignedHours,
      schedule: result.schedule,
      estimatedCompletionDate: result.estimatedCompletionDate,
    });

    await Freelancer.findByIdAndUpdate(result.freelancer._id, {
      $inc: { currentLoad: result.assignedHours },
    });

    // Notify old freelancer — project taken away
    await createNotification({
      userId: assignment.freelancerId.userId._id,
      message: `Project "${project.title}" has been reassigned to another freelancer`,
      type: "reassignment",
      projectId: project._id,
    });

    // Notify new freelancer — new assignment
    await createNotification({
      userId: result.freelancer.userId,
      message: `You have been assigned a new project: "${project.title}"`,
      type: "assignment",
      projectId: project._id,
    });

    const populated = await Assignment.findById(newAssignment._id)
      .populate("projectId", "title requiredSkill deadline priority")
      .populate({
        path: "freelancerId",
        populate: { path: "userId", select: "name email" },
      });

    res.json({ success: true, assignment: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auto-expire assignments where project deadline has passed
// @route   POST /api/allocation/cleanup
// @access  Private (admin only)
export const cleanupExpiredAssignments = async (req, res) => {
  try {
    const today = new Date();

    const expiredAssignments = await Assignment.find({
      status: "active",
    }).populate("projectId", "deadline status title clientId");

    const expiredOnes = expiredAssignments.filter(
      (a) =>
        a.projectId &&
        new Date(a.projectId.deadline) < today &&
        a.projectId.status !== "completed"
    );

    if (expiredOnes.length === 0) {
      return res.json({ message: "No expired assignments found", cleaned: 0 });
    }

    for (const assignment of expiredOnes) {
      const freelancer = await Freelancer.findById(assignment.freelancerId);
      if (freelancer) {
        const newLoad = Math.max(
          0,
          freelancer.currentLoad - assignment.assignedHours
        );
        await Freelancer.findByIdAndUpdate(freelancer._id, {
          currentLoad: newLoad,
        });
      }

      await Assignment.findByIdAndUpdate(assignment._id, {
        status: "cancelled",
      });

      await Project.findByIdAndUpdate(assignment.projectId._id, {
        status: "cancelled",
      });

      // Notify client their project expired
      await createNotification({
        userId: assignment.projectId.clientId,
        message: `Your project "${assignment.projectId.title}" was cancelled — deadline passed without completion`,
        type: "status_update",
        projectId: assignment.projectId._id,
      });
    }

    res.json({
      message: `${expiredOnes.length} expired assignment(s) cleaned up`,
      cleaned: expiredOnes.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};