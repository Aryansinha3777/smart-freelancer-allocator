import axiosInstance from "./axiosInstance.js";

export const getAllProjectsAdmin = () => axiosInstance.get("/project/all");
export const getAllFreelancersAdmin = () => axiosInstance.get("/freelancer/all");
export const getAllAssignments = () => axiosInstance.get("/allocation/all");
export const reassignProjectAdmin = (assignmentId) =>
  axiosInstance.put(`/allocation/reassign/${assignmentId}`);