import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import bimReducer from './bimSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    bim: bimReducer,
  },
});
