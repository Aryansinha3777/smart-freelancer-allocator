import axiosInstance from "./axiosInstance.js";

export const getMyNotifications = () => axiosInstance.get("/notification");
export const getUnreadCount = () => axiosInstance.get("/notification/unread-count");
export const markAsRead = (id) => axiosInstance.put(`/notification/${id}/read`);
export const markAllAsRead = () => axiosInstance.put("/notification/read-all");