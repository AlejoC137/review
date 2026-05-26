import { createSlice } from '@reduxjs/toolkit';

const bimSlice = createSlice({
  name: 'bim',
  initialState: {
    viewMode: 'canvas', // 'canvas' or 'explorer'
    currentPlan: null,
  },
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    setCurrentPlan: (state, action) => {
      state.currentPlan = action.payload;
    }
  }
});

export const { setViewMode, setCurrentPlan } = bimSlice.actions;
export default bimSlice.reducer;
