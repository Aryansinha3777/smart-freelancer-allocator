import axiosInstance from "./axiosInstance.js";

export const assignProject = (projectId) =>
  axiosInstance.post(`/allocation/assign/${projectId}`);

export const getAssignmentByProject = (projectId) =>
  axiosInstance.get(`/allocation/project/${projectId}`);

export const getMyAssignments = () => axiosInstance.get("/allocation/my");

export const reassignProject = (assignmentId) =>
  axiosInstance.put(`/allocation/reassign/${assignmentId}`);

export const getAllAssignments = () => axiosInstance.get("/allocation/all");