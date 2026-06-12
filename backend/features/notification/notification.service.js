import Notification from "./notification.model.js";

// Single function used by all controllers to create a notification
const createNotification = async ({ userId, message, type, projectId = null }) => {
  try {
    await Notification.create({ userId, message, type, projectId });
  } catch (error) {
    // Notifications are non-critical — log but never crash the main flow
    console.error("Notification creation failed:", error.message);
  }
};

export default createNotification;