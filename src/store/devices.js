import { createSlice } from '@reduxjs/toolkit';

const { reducer, actions } = createSlice({
  name: 'devices',
  initialState: {
    items: {},
    selectedId: null,
    follow: false,
    // device list visibility on the main page; null until first set (defaults to open on desktop)
    listOpen: null,
    loaded: false,
  },
  reducers: {
    refresh(state, action) {
      state.items = {};
      action.payload.forEach((item) => (state.items[item.id] = item));
      state.loaded = true;
    },
    update(state, action) {
      action.payload.forEach((item) => (state.items[item.id] = item));
    },
    selectId(state, action) {
      state.selectTime = Date.now();
      state.selectedId = action.payload;
      state.follow = false;
    },
    setListOpen(state, action) {
      state.listOpen = action.payload;
    },
    toggleFollow(state) {
      state.follow = !state.follow;
    },
    remove(state, action) {
      delete state.items[action.payload];
    },
  },
});

export { actions as devicesActions };
export { reducer as devicesReducer };
