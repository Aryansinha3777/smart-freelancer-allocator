import Notification from "./notification.model.js";
import redis from "../../config/redis.js";

// @desc    Get all notifications for logged in user
// @route   GET /api/notification
// @access  Private
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread notification count — Redis cached
// @route   GET /api/notification/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const cacheKey = `unread:${req.user._id}`;

    // Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return res.json({ count: parseInt(cached) });
    }

    // Cache miss — query MongoDB
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    // Store in Redis for 60 seconds
    await redis.set(cacheKey, count, "EX", 60);

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notification/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true }
    );

    // Invalidate cache — count has changed
    await redis.del(`unread:${req.user._id}`);

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notification/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    // Invalidate cache
    await redis.del(`unread:${req.user._id}`);

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};