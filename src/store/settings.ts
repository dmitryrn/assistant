import * as SecureStore from 'expo-secure-store';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';

const OPENAI_API_KEY_STORAGE_KEY = 'settings.openaiApiKey';
const MODEL_STORAGE_KEY = 'settings.model';

type SettingsState = {
  openAIAPIKey: string;
  model: string;
  isLoading: boolean;
};

const initialState: SettingsState = {
  openAIAPIKey: '',
  model: '',
  isLoading: false,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

export const loadSettings = createAsyncThunk<
  { openAIAPIKey: string; model: string },
  void,
  { rejectValue: string }
>('settings/load', async (_, { rejectWithValue }) => {
  try {
    const openAIAPIKey = (await SecureStore.getItemAsync(OPENAI_API_KEY_STORAGE_KEY)) ?? '';
    const model = (await SecureStore.getItemAsync(MODEL_STORAGE_KEY)) ?? '';

    return { openAIAPIKey, model };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const saveSettings = createAsyncThunk<
  { openAIAPIKey: string; model: string },
  { openAIAPIKey: string; model: string },
  { rejectValue: string }
>('settings/save', async ({ openAIAPIKey, model }, { rejectWithValue }) => {
  try {
    const trimmedKey = openAIAPIKey.trim();
    await SecureStore.setItemAsync(OPENAI_API_KEY_STORAGE_KEY, trimmedKey);
    await SecureStore.setItemAsync(MODEL_STORAGE_KEY, model);

    return {
      openAIAPIKey: trimmedKey,
      model,
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
    setModel(state, action: PayloadAction<string>) {
      state.model = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.openAIAPIKey = action.payload.openAIAPIKey;
        state.model = action.payload.model;
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        const message = action.payload ?? action.error.message ?? 'Could not load settings.';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      })

      .addCase(saveSettings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.openAIAPIKey = action.payload.openAIAPIKey;
        state.model = action.payload.model;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isLoading = false;
        const message = action.payload ?? action.error.message ?? 'Could not save settings.';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      });
  },
});

export const { setOpenAIAPIKey, setModel } = settingsSlice.actions;

export default settingsSlice.reducer;
