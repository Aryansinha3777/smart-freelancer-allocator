import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  freelancers: [],
  loading: false,
  error: null,
};

const freelancerSlice = createSlice({
  name: "freelancer",
  initialState,
  reducers: {
    setFreelancers: (state, action) => {
      state.freelancers = action.payload;
    },
    updateFreelancer: (state, action) => {
      const index = state.freelancers.findIndex(
        (f) => f._id === action.payload._id
      );
      if (index !== -1) state.freelancers[index] = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setFreelancers, updateFreelancer, setLoading, setError } =
  freelancerSlice.actions;
export default freelancerSlice.reducer;