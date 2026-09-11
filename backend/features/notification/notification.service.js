import Notification from "./notification.model.js";
import redis from "../../config/redis.js";

const createNotification = async ({
  userId,
  message,
  type,
  projectId = null,
}) => {
  try {
    await Notification.create({ userId, message, type, projectId });

    // Invalidate unread count cache for this user
    // so next poll gets fresh count from MongoDB
    await redis.del(`unread:${userId}`);
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

export default createNotification;