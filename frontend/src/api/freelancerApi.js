import axiosInstance from "./axiosInstance.js";

export const createFreelancerProfile = (data) =>
  axiosInstance.post("/freelancer/profile", data);

export const getMyFreelancerProfile = () =>
  axiosInstance.get("/freelancer/profile/me");

export const updateFreelancerProfile = (data) =>
  axiosInstance.put("/freelancer/profile", data);

export const getAllFreelancers = () => axiosInstance.get("/freelancer/all");