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