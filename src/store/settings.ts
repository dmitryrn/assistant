import * as SecureStore from 'expo-secure-store';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const OPENAI_API_KEY_STORAGE_KEY = 'settings.openaiApiKey';

type SettingsState = {
  openAIAPIKey: string;
  isLoading: boolean;
  error: string | null;
};

const initialState: SettingsState = {
  openAIAPIKey: '',
  isLoading: false,
  error: null,
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

export const loadSettings = createAsyncThunk<
  { openAIAPIKey: string },
  void,
  { rejectValue: string }
>('settings/load', async (_, { rejectWithValue }) => {
  try {
    const openAIAPIKey = (await SecureStore.getItemAsync(OPENAI_API_KEY_STORAGE_KEY)) ?? '';

    return { openAIAPIKey };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const saveSettings = createAsyncThunk<
  { openAIAPIKey: string },
  { openAIAPIKey: string },
  { rejectValue: string }
>('settings/save', async ({ openAIAPIKey }, { rejectWithValue }) => {
  try {
    const trimmedKey = openAIAPIKey.trim();
    await SecureStore.setItemAsync(OPENAI_API_KEY_STORAGE_KEY, trimmedKey);

    return {
      openAIAPIKey: trimmedKey,
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setOpenAIAPIKey(state, action: PayloadAction<string>) {
      state.openAIAPIKey = action.payload;
    },
    clearSettingsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.openAIAPIKey = action.payload.openAIAPIKey;
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? action.error.message ?? 'Could not load settings.';
      })

      .addCase(saveSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.openAIAPIKey = action.payload.openAIAPIKey;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? action.error.message ?? 'Could not save settings.';
      });
  },
});

export const { clearSettingsError, setOpenAIAPIKey } = settingsSlice.actions;

export default settingsSlice.reducer;
