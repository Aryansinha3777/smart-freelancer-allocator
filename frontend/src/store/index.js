import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import projectReducer from "./projectSlice.js";
import freelancerReducer from "./freelancerSlice.js";
import notificationReducer from "./notificationSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    freelancer: freelancerReducer,
    notification: notificationReducer,
  },
});

export default store;