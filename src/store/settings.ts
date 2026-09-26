import * as SecureStore from 'expo-secure-store';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';

import { loadLocalLlamaModel, unloadLocalLlamaModel } from '@/lib/local-llama';
import type { RootState } from '@/store';

const OPENAI_API_KEY_STORAGE_KEY = 'settings.openaiApiKey';
const JEV_API_KEY_STORAGE_KEY = 'settings.jevApiKey';
const OPENAI_MODEL_STORAGE_KEY = 'settings.model';
const PROVIDER_STORAGE_KEY = 'settings.provider';
const LOCAL_MODEL_PATH_STORAGE_KEY = 'settings.localModelPath';

export type SettingsProvider = 'openai' | 'jev' | 'local';
type LocalModelStatus = 'idle' | 'loading' | 'loaded' | 'unloading' | 'error';

type SettingsState = {
  openAIAPIKey: string;
  jevAPIKey: string;
  openAIModel: string;
  localModelPath: string;
  localModelStatus: LocalModelStatus;
  localModelError: string;
  localModelLoadRequestId: string | null;
  provider: SettingsProvider;
  isLoading: boolean;
};

const initialState: SettingsState = {
  openAIAPIKey: '',
  jevAPIKey: '',
  openAIModel: '',
  localModelPath: '',
  localModelStatus: 'idle',
  localModelError: '',
  localModelLoadRequestId: null,
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

  if (value === 'jev') {
    return 'jev';
  }

  return 'openai';
}

export const loadSettings = createAsyncThunk<
  { openAIAPIKey: string; jevAPIKey: string; openAIModel: string; localModelPath: string; provider: SettingsProvider },
  void,
  { rejectValue: string }
>('settings/load', async (_, { dispatch, rejectWithValue }) => {
  try {
    const openAIAPIKey = (await SecureStore.getItemAsync(OPENAI_API_KEY_STORAGE_KEY)) ?? '';
    const jevAPIKey = (await SecureStore.getItemAsync(JEV_API_KEY_STORAGE_KEY)) ?? '';
    const openAIModel = (await SecureStore.getItemAsync(OPENAI_MODEL_STORAGE_KEY)) ?? '';
    const localModelPath = (await SecureStore.getItemAsync(LOCAL_MODEL_PATH_STORAGE_KEY)) ?? '';
    const provider = getProvider(await SecureStore.getItemAsync(PROVIDER_STORAGE_KEY));

    if (provider === 'local' && localModelPath) {
      dispatch(loadLocalModel(localModelPath));
    }

    return { openAIAPIKey, jevAPIKey, openAIModel, localModelPath, provider };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const saveSettings = createAsyncThunk<
  { openAIAPIKey: string; jevAPIKey: string; openAIModel: string; localModelPath: string; provider: SettingsProvider },
  { openAIAPIKey: string; jevAPIKey: string; openAIModel: string; localModelPath: string; provider: SettingsProvider },
  { rejectValue: string }
>('settings/save', async ({ openAIAPIKey, jevAPIKey, openAIModel, localModelPath, provider }, { rejectWithValue }) => {
  try {
    const trimmedKey = openAIAPIKey.trim();
    const trimmedJevKey = jevAPIKey.trim();
    await SecureStore.setItemAsync(OPENAI_API_KEY_STORAGE_KEY, trimmedKey);
    await SecureStore.setItemAsync(JEV_API_KEY_STORAGE_KEY, trimmedJevKey);
    await SecureStore.setItemAsync(OPENAI_MODEL_STORAGE_KEY, openAIModel);
    await SecureStore.setItemAsync(LOCAL_MODEL_PATH_STORAGE_KEY, localModelPath);
    await SecureStore.setItemAsync(PROVIDER_STORAGE_KEY, provider);

    return {
      openAIAPIKey: trimmedKey,
      jevAPIKey: trimmedJevKey,
      openAIModel,
      localModelPath,
      provider,
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const loadLocalModel = createAsyncThunk<void, string, { rejectValue: string }>(
  'settings/loadLocalModel',
  async (localModelPath, { rejectWithValue }) => {
    try {
      await loadLocalLlamaModel(localModelPath);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const unloadLocalModel = createAsyncThunk<void, void, { rejectValue: string }>(
  'settings/unloadLocalModel',
  async (_, { rejectWithValue }) => {
    try {
      await unloadLocalLlamaModel();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const selectProvider = createAsyncThunk<
  SettingsProvider,
  SettingsProvider,
  { state: RootState; rejectValue: string }
>('settings/selectProvider', async (provider, { dispatch, getState }) => {
  if (provider !== 'local') {
    dispatch(unloadLocalModel());
    return provider;
  }

  const { localModelPath } = getState().settings;

  if (localModelPath) {
    dispatch(loadLocalModel(localModelPath));
  }

  return provider;
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setOpenAIAPIKey(state, action: PayloadAction<string>) {
      state.openAIAPIKey = action.payload;
    },
    setJevAPIKey(state, action: PayloadAction<string>) {
      state.jevAPIKey = action.payload;
    },
    setOpenAIModel(state, action: PayloadAction<string>) {
      state.openAIModel = action.payload;
    },
    setLocalModelPath(state, action: PayloadAction<string>) {
      state.localModelPath = action.payload;
      state.localModelError = '';
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
        state.jevAPIKey = action.payload.jevAPIKey;
        state.openAIModel = action.payload.openAIModel;
        state.localModelPath = action.payload.localModelPath;
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
        state.jevAPIKey = action.payload.jevAPIKey;
        state.openAIModel = action.payload.openAIModel;
        state.localModelPath = action.payload.localModelPath;
        state.provider = action.payload.provider;
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.isLoading = false;
        const message = action.payload ?? action.error.message ?? 'Could not save settings.';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      })

      .addCase(loadLocalModel.pending, (state, action) => {
        state.localModelStatus = 'loading';
        state.localModelError = '';
        state.localModelLoadRequestId = action.meta.requestId;
      })
      .addCase(loadLocalModel.fulfilled, (state, action) => {
        if (state.localModelLoadRequestId !== action.meta.requestId) {
          return;
        }

        state.localModelStatus = 'loaded';
        state.localModelError = '';
        state.localModelLoadRequestId = null;
      })
      .addCase(loadLocalModel.rejected, (state, action) => {
        if (state.localModelLoadRequestId !== action.meta.requestId) {
          return;
        }

        state.localModelStatus = 'error';
        state.localModelError = action.payload ?? action.error.message ?? 'Could not load local model.';
        state.localModelLoadRequestId = null;
        Toast.show({ type: 'error', text1: 'Error', text2: state.localModelError });
      })

      .addCase(unloadLocalModel.pending, (state) => {
        state.localModelStatus = 'unloading';
        state.localModelError = '';
        state.localModelLoadRequestId = null;
      })
      .addCase(unloadLocalModel.fulfilled, (state) => {
        state.localModelStatus = 'idle';
        state.localModelError = '';
        state.localModelLoadRequestId = null;
      })
      .addCase(unloadLocalModel.rejected, (state, action) => {
        state.localModelStatus = 'error';
        state.localModelError = action.payload ?? action.error.message ?? 'Could not unload local model.';
        state.localModelLoadRequestId = null;
        Toast.show({ type: 'error', text1: 'Error', text2: state.localModelError });
      })

      .addCase(selectProvider.fulfilled, (state, action) => {
        state.provider = action.payload;
      });
  },
});

export const { setJevAPIKey, setLocalModelPath, setOpenAIAPIKey, setOpenAIModel, setProvider } = settingsSlice.actions;

export default settingsSlice.reducer;
