import * as SecureStore from 'expo-secure-store';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';

const OPENAI_API_KEY_STORAGE_KEY = 'settings.openaiApiKey';
const OPENAI_MODEL_STORAGE_KEY = 'settings.model';
const PROVIDER_STORAGE_KEY = 'settings.provider';

export type SettingsProvider = 'openai' | 'local';

type SettingsState = {
  openAIAPIKey: string;
  openAIModel: string;
  provider: SettingsProvider;
  isLoading: boolean;
};

const initialState: SettingsState = {
  openAIAPIKey: '',
  openAIModel: '',
  provider: 'openai',
  isLoading: false,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

function getProvider(value: string | null): SettingsProvider {
  if (value === 'local') {
    return 'local';
  }

  return 'openai';
}

export const loadSettings = createAsyncThunk<
  { openAIAPIKey: string; openAIModel: string; provider: SettingsProvider },
  void,
  { rejectValue: string }
>('settings/load', async (_, { rejectWithValue }) => {
  try {
    const openAIAPIKey = (await SecureStore.getItemAsync(OPENAI_API_KEY_STORAGE_KEY)) ?? '';
    const openAIModel = (await SecureStore.getItemAsync(OPENAI_MODEL_STORAGE_KEY)) ?? '';
    const provider = getProvider(await SecureStore.getItemAsync(PROVIDER_STORAGE_KEY));

    return { openAIAPIKey, openAIModel, provider };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const saveSettings = createAsyncThunk<
  { openAIAPIKey: string; openAIModel: string; provider: SettingsProvider },
  { openAIAPIKey: string; openAIModel: string; provider: SettingsProvider },
  { rejectValue: string }
>('settings/save', async ({ openAIAPIKey, openAIModel, provider }, { rejectWithValue }) => {
  try {
    const trimmedKey = openAIAPIKey.trim();
    await SecureStore.setItemAsync(OPENAI_API_KEY_STORAGE_KEY, trimmedKey);
    await SecureStore.setItemAsync(OPENAI_MODEL_STORAGE_KEY, openAIModel);
    await SecureStore.setItemAsync(PROVIDER_STORAGE_KEY, provider);

    return {
      openAIAPIKey: trimmedKey,
      openAIModel,
      provider,
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
    setOpenAIModel(state, action: PayloadAction<string>) {
      state.openAIModel = action.payload;
    },
    setProvider(state, action: PayloadAction<SettingsProvider>) {
      state.provider = action.payload;
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
        state.openAIModel = action.payload.openAIModel;
        state.provider = action.payload.provider;
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
        state.openAIModel = action.payload.openAIModel;
        state.provider = action.payload.provider;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isLoading = false;
        const message = action.payload ?? action.error.message ?? 'Could not save settings.';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      });
  },
});

export const { setOpenAIAPIKey, setOpenAIModel, setProvider } = settingsSlice.actions;

export default settingsSlice.reducer;
