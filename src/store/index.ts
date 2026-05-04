import { configureStore } from '@reduxjs/toolkit';

import requestReducer from '@/store/request';
import settingsReducer from '@/store/settings';

export const store = configureStore({
  reducer: {
    request: requestReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
