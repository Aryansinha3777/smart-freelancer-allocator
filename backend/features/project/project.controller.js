import Project from "./project.model.js";
import Assignment from "../allocation/allocation.model.js";

// @desc    Create a new project
// @route   POST /api/project
// @access  Private (client only)
export const createProject = async (req, res) => {
  try {
    const { title, description, requiredSkill, deadline, estimatedHours, priority } =
      req.body;

    const project = await Project.create({
      clientId: req.user._id,
      title,
      description,
      requiredSkill,
      deadline,
      estimatedHours,
      priority,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects for logged in client
// @route   GET /api/project/my
// @access  Private (client only)
export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ clientId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project by ID
// @route   GET /api/project/:id
// @access  Private
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "clientId",
      "name email"
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects (admin view)
// @route   GET /api/project/all
// @access  Private (admin only)
export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("clientId", "name email")
      .sort({ priority: -1, createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project status by assigned freelancer
// @route   PUT /api/project/:id/status
// @access  Private (freelancer only)
export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Only these two transitions are allowed for a freelancer
    const allowedTransitions = {
      assigned: "in_progress",
      in_progress: "completed",
    };

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Confirm the requesting freelancer is actually assigned to this project
    const Freelancer = (await import("../freelancer/freelancer.model.js")).default;
    const freelancerProfile = await Freelancer.findOne({
      userId: req.user._id,
    });

    if (!freelancerProfile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    const assignment = await Assignment.findOne({
      projectId: project._id,
      freelancerId: freelancerProfile._id,
      status: "active",
    });

    if (!assignment) {
      return res.status(403).json({
        message: "You are not assigned to this project",
      });
    }

    // Check the transition is valid
    const nextStatus = allowedTransitions[project.status];
    if (!nextStatus || nextStatus !== status) {
      return res.status(400).json({
        message: `Invalid transition. Current status is "${project.status}". Allowed next status is "${nextStatus}"`,
      });
    }

    // Update project status
    project.status = status;
    await project.save();

    // If completed — mark assignment as completed and release workload
    if (status === "completed") {
      await Assignment.findByIdAndUpdate(assignment._id, {
        status: "completed",
      });

      await Freelancer.findByIdAndUpdate(freelancerProfile._id, {
        $inc: { currentLoad: -assignment.assignedHours },
      });
    }

    res.json({ message: `Project moved to ${status}`, project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};