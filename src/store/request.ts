import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { AppService } from '@/lib/app-service';
import { Clock } from '@/lib/clock';
import { OpenAIClient } from '@/lib/openai-client';
import { ToolsExecutor } from '@/lib/tools-executor';
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

export const sendRequest = createAsyncThunk<string, { prompt: string }, { state: RootState; rejectValue: string }>(
  'request/send',
  async ({ prompt }, { getState, rejectWithValue }) => {
    const { openAIAPIKey } = getState().settings;

    if (!openAIAPIKey) {
      return rejectWithValue('OpenAI API key is not set.');
    }

    try {
      const appService = createAppService(openAIAPIKey);
      const toolCalls = await appService.request(prompt);

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
