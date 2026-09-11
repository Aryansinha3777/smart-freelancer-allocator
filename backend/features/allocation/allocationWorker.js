import dotenv from "dotenv";
dotenv.config();

import allocationQueue from "./allocationQueue.js";
import Project from "../project/project.model.js";
import Freelancer from "../freelancer/freelancer.model.js";
import Assignment from "./allocation.model.js";
import "../../features/auth/auth.model.js";
import runAllocationEngine from "./allocationEngine.js";
import createNotification from "../notification/notification.service.js";
import connectDB from "../../config/db.js";
import redis from "../../config/redis.js";

// Worker needs its own DB connection
connectDB();

allocationQueue.process(async (job) => {
  const { projectId, clientId } = job.data;

  console.log(`Processing allocation job ${job.id} for project ${projectId}`);

  try {
    // Mark job as processing in Redis
    await redis.set(`allocation:${job.id}`, "processing", "EX", 3600);

    const project = await Project.findById(projectId);

    if (!project || project.status !== "pending") {
      await redis.set(
        `allocation:${job.id}`,
        JSON.stringify({
          status: "failed",
          message: "Project not found or already assigned",
        }),
        "EX", 3600
      );
      return;
    }

    // Fetch freelancers and run engine
    const freelancers = await Freelancer.find({ isAvailable: true });
    const result = runAllocationEngine(project, freelancers);

    if (!result.success) {
      // Engine failed — store result and notify client
      await redis.set(
        `allocation:${job.id}`,
        JSON.stringify({
          status: "failed",
          message: result.message,
          suggestions: result.suggestions,
        }),
        "EX", 3600
      );

      await createNotification({
        userId: clientId,
        message: `Allocation failed for "${project.title}" — ${result.message}`,
        type: "status_update",
        projectId: project._id,
      });

      return;
    }

    // Engine succeeded — three writes in correct order
    const assignment = await Assignment.create({
      projectId: project._id,
      freelancerId: result.freelancer._id,
      assignedHours: result.assignedHours,
      schedule: result.schedule,
      estimatedCompletionDate: result.estimatedCompletionDate,
    });

    await Freelancer.findByIdAndUpdate(result.freelancer._id, {
      $inc: { currentLoad: result.assignedHours },
    });

    await Project.findByIdAndUpdate(project._id, { status: "assigned" });

    // Notify freelancer
    await createNotification({
      userId: result.freelancer.userId,
      message: `You have been assigned a new project: "${project.title}"`,
      type: "assignment",
      projectId: project._id,
    });

    // Notify client
    await createNotification({
      userId: clientId,
      message: `"${project.title}" has been successfully allocated`,
      type: "status_update",
      projectId: project._id,
    });

    // Store success result in Redis for frontend to poll
    // Populate userId to get freelancer name
    const populatedFreelancer = await Freelancer.findById(
      result.freelancer._id
    ).populate("userId", "name");

      await redis.set(
        `allocation:${job.id}`,
        JSON.stringify({
          status: "completed",
          freelancerName: populatedFreelancer?.userId?.name || "Freelancer",
          estimatedCompletionDate: result.estimatedCompletionDate,
          schedule: result.schedule,
        }),
        "EX", 3600
      );

    console.log(`Job ${job.id} completed successfully`);

  } catch (error) {
    console.error(`Job ${job.id} failed:`, error.message);

    await redis.set(
      `allocation:${job.id}`,
      JSON.stringify({
        status: "failed",
        message: "Internal error during allocation",
      }),
      "EX", 3600
    );

    throw error; // Bull will mark job as failed and can retry
  }
});

console.log("Allocation worker is running and watching the queue...");