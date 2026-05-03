import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import projectReducer from "./projectSlice.js";
import freelancerReducer from "./freelancerSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    freelancer: freelancerReducer,
  },
});

export default store;