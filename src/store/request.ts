import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { getAppService } from '@/lib/get-app-service';
import type { RootState } from '@/store';

type RequestState = {
  isLoading: boolean;
  error: string | null;
  toolCallsDebug: string;
};

const initialState: RequestState = {
  isLoading: false,
  error: null,
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
    const { openAIAPIKey, model } = getState().settings;

    if (!openAIAPIKey) {
      return rejectWithValue('OpenAI API key is not set.');
    }

    if (!model) {
      return rejectWithValue('Model is not set.');
    }

    try {
      const toolCalls = await getAppService().request(openAIAPIKey, model, prompt);

      return JSON.stringify(toolCalls, null, 2);
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
        state.error = null;
        state.toolCallsDebug = '';
      })
      .addCase(sendRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.toolCallsDebug = action.payload;
      })
      .addCase(sendRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.toolCallsDebug = '';
        state.error = action.payload ?? action.error.message ?? 'Could not send request.';
      });
  },
});

export default requestSlice.reducer;
