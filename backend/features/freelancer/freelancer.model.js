import mongoose from "mongoose";

const freelancerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      required: [true, "At least one skill is required"],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Skills array cannot be empty",
      },
    },
    dailyCapacity: {
      type: Number,
      required: true,
      min: [1, "Daily capacity must be at least 1 hour"],
      max: [12, "Daily capacity cannot exceed 12 hours"],
      default: 6,
    },
    currentLoad: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

// Virtual — remaining hours today
freelancerSchema.virtual("remainingHours").get(function () {
  return this.dailyCapacity - this.currentLoad;
});

freelancerSchema.set("toJSON", { virtuals: true });
freelancerSchema.set("toObject", { virtuals: true });

const Freelancer = mongoose.model("Freelancer", freelancerSchema);

export default Freelancer;