import axiosInstance from "./axiosInstance.js";

export const createProject = (data) => axiosInstance.post("/project", data);
export const getMyProjects = () => axiosInstance.get("/project/my");
export const getProjectById = (id) => axiosInstance.get(`/project/${id}`);
export const getAllProjects = () => axiosInstance.get("/project/all");
export const updateProjectStatus = (projectId, status) =>
  axiosInstance.put(`/project/${projectId}/status`, { status });