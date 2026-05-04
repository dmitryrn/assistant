import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { AppService } from '@/lib/app-service';
import { Clock } from '@/lib/clock';
import { OpenAIClient } from '@/lib/openai-client';
import { ToolsExecutor } from '@/lib/tools-executor';
import type { RootState } from '@/store';

type RequestState = {
  isLoading: boolean;
  error: string | null;
};

const initialState: RequestState = {
  isLoading: false,
  error: null,
};

function createAppService(apiKey: string) {
  const clock = new Clock();
  const toolsExecutor = new ToolsExecutor(clock);
  const openAIClient = new OpenAIClient(apiKey);

  return new AppService(openAIClient, toolsExecutor);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

export const sendRequest = createAsyncThunk<void, { prompt: string }, { state: RootState; rejectValue: string }>(
  'request/send',
  async ({ prompt }, { getState, rejectWithValue }) => {
    const { openAIAPIKey } = getState().settings;

    if (!openAIAPIKey) {
      return rejectWithValue('OpenAI API key is not set.');
    }

    try {
      const appService = createAppService(openAIAPIKey);
      await appService.request(prompt);
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
      })
      .addCase(sendRequest.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? action.error.message ?? 'Could not send request.';
      });
  },
});

export default requestSlice.reducer;
