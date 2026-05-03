import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    requiredSkill: {
      type: String,
      required: [true, "Required skill is required"],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    estimatedHours: {
      type: Number,
      required: [true, "Estimated hours is required"],
      min: [1, "Must be at least 1 hour"],
    },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;