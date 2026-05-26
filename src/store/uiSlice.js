import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inspector: {
    isOpen: false,
    item: null, // The action/task/unit being inspected
    type: null, // 'task', 'space', 'staff', 'incident'
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openInspector: (state, action) => {
      state.inspector.isOpen = true;
      state.inspector.item = action.payload.item;
      state.inspector.type = action.payload.type;
    },
    closeInspector: (state) => {
      state.inspector.isOpen = false;
      state.inspector.item = null;
      state.inspector.type = null;
    },
  },
});

export const { openInspector, closeInspector } = uiSlice.actions;
export default uiSlice.reducer;
