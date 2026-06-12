import Freelancer from "./freelancer.model.js";
import createNotification from "../notification/notification.service.js";

export const createProfile = async (req, res) => {
  try {
    const existing = await Freelancer.findOne({ userId: req.user._id });
    if (existing) return res.status(400).json({ message: "Profile already exists" });
    const { skills, dailyCapacity } = req.body;
    const profile = await Freelancer.create({ userId: req.user._id, skills, dailyCapacity });
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const profile = await Freelancer.findOne({ userId: req.user._id }).populate("userId", "name email");
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { skills, dailyCapacity, isAvailable } = req.body;
    const profile = await Freelancer.findOneAndUpdate(
      { userId: req.user._id },
      { skills, dailyCapacity, isAvailable },
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const Assignment = (await import("../allocation/allocation.model.js")).default;
    const activeAssignments = await Assignment.find({
      freelancerId: profile._id,
      status: "active",
    }).populate("projectId", "title requiredSkill");

    const mismatched = activeAssignments.filter(
      (a) => !skills.map((s) => s.toLowerCase()).includes(a.projectId.requiredSkill.toLowerCase())
    );

    if (mismatched.length > 0) {
      return res.json({
        profile,
        warnings: mismatched.map(
          (a) => `Project "${a.projectId.title}" requires "${a.projectId.requiredSkill}" which is no longer in your skill set.`
        ),
      });
    }
    res.json({ profile, warnings: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

    const Project = (await import("../project/project.model.js")).default;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (project.status !== "completed") {
      return res.status(400).json({ message: "Can only rate after project is completed" });
    }
    if (project.isRated) {
      return res.status(400).json({ message: "You have already rated this project" });
    }

    const freelancer = await Freelancer.findById(req.params.freelancerId);
    if (!freelancer) return res.status(404).json({ message: "Freelancer not found" });

    const totalRatings = freelancer.totalRatings || 0;
    const currentRating = freelancer.rating || 0;
    const newAverage = (currentRating * totalRatings + rating) / (totalRatings + 1);

    await Freelancer.findByIdAndUpdate(freelancer._id, {
      rating: Math.round(newAverage * 10) / 10,
      totalRatings: totalRatings + 1,
    });

    await Project.findByIdAndUpdate(projectId, { isRated: true });

    // Notify freelancer — rating received
    await createNotification({
      userId: freelancer.userId,
      message: `You received a ${rating}-star rating for project "${project.title}"`,
      type: "rating",
      projectId: project._id,
    });

    res.json({
      message: "Rating submitted successfully",
      newRating: Math.round(newAverage * 10) / 10,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};