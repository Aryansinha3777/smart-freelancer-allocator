import mongoose from "mongoose";

const scheduleBlockSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  hours: { type: Number, required: true },
});

const assignmentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true,
    },
    assignedHours: {
      type: Number,
      required: true,
    },
    schedule: [scheduleBlockSchema],
    estimatedCompletionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "completed", "reassigned", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;