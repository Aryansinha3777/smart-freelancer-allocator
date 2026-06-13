import Project from "./project.model.js";
import Assignment from "../allocation/allocation.model.js";
import createNotification from "../notification/notification.service.js";

export const createProject = async (req, res) => {
  try {
    const { title, description, requiredSkill, deadline, estimatedHours, priority } = req.body;
    const project = await Project.create({
      clientId: req.user._id,
      title, description, requiredSkill, deadline, estimatedHours, priority,
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ clientId: req.user._id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("clientId", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

export const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedTransitions = {
      assigned: "in_progress",
      in_progress: "completed",
    };

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const Freelancer = (await import("../freelancer/freelancer.model.js")).default;
    const freelancerProfile = await Freelancer.findOne({ userId: req.user._id });
    if (!freelancerProfile) return res.status(404).json({ message: "Freelancer profile not found" });

    const assignment = await Assignment.findOne({
      projectId: project._id,
      freelancerId: freelancerProfile._id,
      status: "active",
    });

    if (!assignment) return res.status(403).json({ message: "You are not assigned to this project" });

    const nextStatus = allowedTransitions[project.status];
    if (!nextStatus || nextStatus !== status) {
      return res.status(400).json({
        message: `Invalid transition. Current status is "${project.status}". Allowed next status is "${nextStatus}"`,
      });
    }

    project.status = status;
    await project.save();

    if (status === "completed") {
      await Assignment.findByIdAndUpdate(assignment._id, { status: "completed" });

      const freelancer = await Freelancer.findById(freelancerProfile._id);
      const newLoad = Math.max(0, freelancer.currentLoad - assignment.assignedHours);
      await Freelancer.findByIdAndUpdate(freelancerProfile._id, { currentLoad: newLoad });

      // Notify client — project completed
      await createNotification({
        userId: project.clientId,
        message: `Your project "${project.title}" has been marked as completed`,
        type: "status_update",
        projectId: project._id,
      });

    } else if (status === "in_progress") {
      // Notify client — work started
      await createNotification({
        userId: project.clientId,
        message: `Work has started on your project "${project.title}"`,
        type: "status_update",
        projectId: project._id,
      });
    }

    res.json({ message: `Project moved to ${status}`, project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project details (only if still pending)
// @route   PUT /api/project/:id
// @access  Private (client only)
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only the owner can edit
    if (project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Only pending projects can be edited
    if (project.status !== "pending") {
      return res.status(400).json({
        message: "Only pending projects can be edited",
      });
    }

    const { title, description, requiredSkill, deadline, estimatedHours, priority } =
      req.body;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { title, description, requiredSkill, deadline, estimatedHours, priority },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};