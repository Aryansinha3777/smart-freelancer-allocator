import Project from "../project/project.model.js";
import Freelancer from "../freelancer/freelancer.model.js";
import Assignment from "./allocation.model.js";
import runAllocationEngine from "./allocationEngine.js";

// @desc    Trigger allocation for a project
// @route   POST /api/allocation/assign/:projectId
// @access  Private (client only)
export const assignProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only the client who owns the project can trigger allocation
    if (project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (project.status !== "pending") {
      return res.status(400).json({
        message: `Project is already ${project.status}`,
      });
    }

    // Fetch all available freelancers from DB
    const freelancers = await Freelancer.find({ isAvailable: true });

    // Run the engine — pure logic
    const result = runAllocationEngine(project, freelancers);

    // Engine failed — return suggestions to client
    if (!result.success) {
      return res.status(200).json({
        success: false,
        reason: result.reason,
        message: result.message,
        suggestions: result.suggestions,
      });
    }

    // Engine succeeded — save assignment
    const assignment = await Assignment.create({
      projectId: project._id,
      freelancerId: result.freelancer._id,
      assignedHours: result.assignedHours,
      schedule: result.schedule,
      estimatedCompletionDate: result.estimatedCompletionDate,
    });

    // Update freelancer workload
    await Freelancer.findByIdAndUpdate(result.freelancer._id, {
      $inc: { currentLoad: result.assignedHours },
    });

    // Update project status
    await Project.findByIdAndUpdate(project._id, { status: "assigned" });

    // Return full assignment with populated fields
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
      status: "active",          
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
    const freelancerProfile = await (
      await import("../freelancer/freelancer.model.js")
    ).default.findOne({ userId: req.user._id });

    if (!freelancerProfile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    const assignments = await Assignment.find({
      freelancerId: freelancerProfile._id,
      status: "active",
    }).populate("projectId", "title requiredSkill deadline priority estimatedHours status");

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
      .populate("projectId", "title requiredSkill deadline priority status estimatedHours")
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
    const assignment = await Assignment.findById(req.params.assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const project = await Project.findById(assignment.projectId);

    // Fetch all freelancers except the current one
    const freelancers = await Freelancer.find({
      isAvailable: true,
      _id: { $ne: assignment.freelancerId },
    });

    // Run engine FIRST — before touching anything in DB
    const result = runAllocationEngine(project, freelancers);

    // Engine failed — return suggestions, change NOTHING in DB
    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.message,
        suggestions: result.suggestions,
      });
    }

    // Only now — engine found someone — safe to modify DB
    // Release workload from current freelancer
    await Freelancer.findByIdAndUpdate(assignment.freelancerId, {
      $inc: { currentLoad: -assignment.assignedHours },
    });

    // Mark old assignment as reassigned
    await Assignment.findByIdAndUpdate(assignment._id, {
      status: "reassigned",
    });

    // Create new assignment
    const newAssignment = await Assignment.create({
      projectId: project._id,
      freelancerId: result.freelancer._id,
      assignedHours: result.assignedHours,
      schedule: result.schedule,
      estimatedCompletionDate: result.estimatedCompletionDate,
    });

    // Add workload to new freelancer
    await Freelancer.findByIdAndUpdate(result.freelancer._id, {
      $inc: { currentLoad: result.assignedHours },
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