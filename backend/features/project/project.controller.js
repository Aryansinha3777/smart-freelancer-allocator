import Project from "./project.model.js";

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