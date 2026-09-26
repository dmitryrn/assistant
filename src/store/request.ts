import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';

import { getAppService } from '@/lib/get-app-service';
import type { RootState } from '@/store';

type RequestState = {
  isLoading: boolean;
  toolCallsDebug: string;
};

const initialState: RequestState = {
  isLoading: false,
  toolCallsDebug: '',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

export const sendRequest = createAsyncThunk<string, { prompt: string }, { state: RootState; rejectValue: string }>(
  'request/send',
  async ({ prompt }, { getState, rejectWithValue }) => {
    const { localModelPath, localModelStatus, openAIAPIKey, openAIModel, provider } = getState().settings;

    if (provider === 'local') {
      if (!localModelPath) {
        return rejectWithValue('Local model is not set.');
      }

      if (localModelStatus !== 'loaded') {
        return rejectWithValue('Local model is not loaded.');
      }

      try {
        const result = await getAppService().requestLocal(prompt);

        return JSON.stringify(result.toolCalls, null, 2);
      } catch (error) {
        console.log(error);

        return rejectWithValue(getErrorMessage(error));
      }
    }

    if (provider === 'jev') {
      return rejectWithValue('Jev requests are not supported yet.');
    }

    if (!openAIAPIKey) {
      return rejectWithValue('OpenAI API key is not set.');
    }

    if (!openAIModel) {
      return rejectWithValue('Model is not set.');
    }

    try {
      const result = await getAppService().requestOpenAI(openAIAPIKey, openAIModel, prompt);

      return JSON.stringify(result.toolCalls, null, 2);
    } catch (error) {
      console.log(error);

      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const requestSlice = createSlice({
  name: 'request',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(sendRequest.pending, (state) => {
        state.isLoading = true;
        state.toolCallsDebug = '';
      })
      .addCase(sendRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.toolCallsDebug = action.payload;
      })
      .addCase(sendRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.toolCallsDebug = '';
        const message = action.payload ?? action.error.message ?? 'Could not send request.';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      });
  },
});

export default requestSlice.reducer;
