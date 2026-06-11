import Freelancer from "./freelancer.model.js";

// @desc    Create freelancer profile
// @route   POST /api/freelancer/profile
// @access  Private (freelancer only)
export const createProfile = async (req, res) => {
  try {
    const existing = await Freelancer.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const { skills, dailyCapacity } = req.body;

    const profile = await Freelancer.create({
      userId: req.user._id,
      skills,
      dailyCapacity,
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my freelancer profile
// @route   GET /api/freelancer/profile/me
// @access  Private (freelancer only)
export const getMyProfile = async (req, res) => {
  try {
    const profile = await Freelancer.findOne({
      userId: req.user._id,
    }).populate("userId", "name email");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update freelancer profile
// @route   PUT /api/freelancer/profile
// @access  Private (freelancer only)
export const updateProfile = async (req, res) => {
  try {
    const { skills, dailyCapacity, isAvailable } = req.body;

    const profile = await Freelancer.findOneAndUpdate(
      { userId: req.user._id },
      { skills, dailyCapacity, isAvailable },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all freelancers (admin + allocation engine use)
// @route   GET /api/freelancer/all
// @access  Private (admin only)
export const getAllFreelancers = async (req, res) => {
  try {
    const freelancers = await Freelancer.find().populate("userId", "name email");
    res.json(freelancers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const rateFreelancer = async (req, res) => {
  try {
    const { rating, projectId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Verify this project belongs to this client
    const Project = (await import("../project/project.model.js")).default;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (project.status !== "completed") {
      return res.status(400).json({
        message: "Can only rate after project is completed",
      });
    }

    // Check this project hasn't already been rated
    if (project.isRated) {
      return res.status(400).json({
        message: "You have already rated this project",
      });
    }

    // Get freelancer profile
    const freelancer = await Freelancer.findById(req.params.freelancerId);

    if (!freelancer) {
      return res.status(404).json({ message: "Freelancer not found" });
    }

    // Calculate new average rating
    // formula: ((currentRating * totalRatings) + newRating) / (totalRatings + 1)
    const totalRatings = freelancer.totalRatings || 0;
    const currentRating = freelancer.rating || 0;
    const newAverage =
      (currentRating * totalRatings + rating) / (totalRatings + 1);

    // Update freelancer rating
    await Freelancer.findByIdAndUpdate(freelancer._id, {
      rating: Math.round(newAverage * 10) / 10, // round to 1 decimal
      totalRatings: totalRatings + 1,
    });

    // Mark project as rated so client can't rate twice
    await Project.findByIdAndUpdate(projectId, { isRated: true });

    res.json({
      message: "Rating submitted successfully",
      newRating: Math.round(newAverage * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};