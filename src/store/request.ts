import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';

import type { JevClockAction, JevSuggestion } from '@/lib/app-service';
import { getAppService } from '@/lib/get-app-service';
import type { RootState } from '@/store';

type RequestState = {
  isLoading: boolean;
  toolCallsDebug: string;
  jevDebug: string;
  jevSuggestion: JevSuggestion | null;
  isExecuting: boolean;
};

type SendRequestResult = {
  toolCallsDebug: string;
  jevDebug: string;
  jevSuggestion: JevSuggestion | null;
  executedJevAction?: JevClockAction;
};

const initialState: RequestState = {
  isLoading: false,
  toolCallsDebug: '',
  jevDebug: '',
  jevSuggestion: null,
  isExecuting: false,
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}

function showActionSuccess(action: JevClockAction): void {
  if (action.tool === 'alarm') {
    const hour = String(action.hour).padStart(2, '0');
    const minute = String(action.minute).padStart(2, '0');
    let text2 = `Set for ${hour}:${minute}`;

    if (action.label) {
      text2 += `: ${action.label}`;
    }

    Toast.show({ type: 'success', text1: 'Alarm set', text2 });
    return;
  }

  let unit = 'minutes';
  if (action.minutes === 1) {
    unit = 'minute';
  }

  Toast.show({ type: 'success', text1: 'Timer set', text2: `${action.minutes} ${unit}` });
}

export const sendRequest = createAsyncThunk<SendRequestResult, { prompt: string }, { state: RootState; rejectValue: string }>(
  'request/send',
  async ({ prompt }, { dispatch, getState, rejectWithValue }) => {
    const { jevAPIKey, localModelPath, localModelStatus, openAIAPIKey, openAIModel, provider } = getState().settings;

    if (provider === 'local') {
      if (!localModelPath) {
        return rejectWithValue('Local model is not set.');
      }

      if (localModelStatus !== 'loaded') {
        return rejectWithValue('Local model is not loaded.');
      }

      try {
        const result = await getAppService().requestLocal(prompt);

        return { toolCallsDebug: JSON.stringify(result.toolCalls, null, 2), jevDebug: '', jevSuggestion: null };
      } catch (error) {
        console.log(error);

        return rejectWithValue(getErrorMessage(error));
      }
    }

    if (provider === 'jev') {
      if (!jevAPIKey) {
        return rejectWithValue('Jev API key is not set.');
      }

      try {
        const result = await getAppService().requestJev(jevAPIKey, prompt, (debug) => dispatch(setJevDebug(debug)));

        return {
          toolCallsDebug: JSON.stringify(result.toolCalls, null, 2),
          jevDebug: result.jevDebug ?? '',
          jevSuggestion: result.jevSuggestion ?? null,
          executedJevAction: result.executedJevAction,
        };
      } catch (error) {
        console.log(error);

        return rejectWithValue(getErrorMessage(error));
      }
    }

    if (!openAIAPIKey) {
      return rejectWithValue('OpenAI API key is not set.');
    }

    if (!openAIModel) {
      return rejectWithValue('Model is not set.');
    }

    try {
      const result = await getAppService().requestOpenAI(openAIAPIKey, openAIModel, prompt);

      return { toolCallsDebug: JSON.stringify(result.toolCalls, null, 2), jevDebug: '', jevSuggestion: null };
    } catch (error) {
      console.log(error);

      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const executeJevAction = createAsyncThunk<
  string,
  JevClockAction,
  { rejectValue: string }
>('request/executeJevAction', async (action, { rejectWithValue }) => {
  try {
    const toolCall = await getAppService().executeJevAction(action);

    return JSON.stringify([toolCall], null, 2);
  } catch (error) {
    console.log(error);

    return rejectWithValue(getErrorMessage(error));
  }
});

const requestSlice = createSlice({
  name: 'request',
  initialState,
  reducers: {
    setJevDebug(state, action: PayloadAction<string>) {
      state.jevDebug = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendRequest.pending, (state) => {
        state.isLoading = true;
        state.toolCallsDebug = '';
        state.jevDebug = '';
        state.jevSuggestion = null;
      })
      .addCase(sendRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.toolCallsDebug = action.payload.toolCallsDebug;
        state.jevDebug = action.payload.jevDebug;
        state.jevSuggestion = action.payload.jevSuggestion;

        if (action.payload.executedJevAction) {
          showActionSuccess(action.payload.executedJevAction);
        }
      })
      .addCase(sendRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.toolCallsDebug = '';
        const message = action.payload ?? action.error.message ?? 'Could not send request.';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      })
      .addCase(executeJevAction.pending, (state) => {
        state.isExecuting = true;
      })
      .addCase(executeJevAction.fulfilled, (state, action) => {
        state.isExecuting = false;
        state.toolCallsDebug = action.payload;
        showActionSuccess(action.meta.arg);
      })
      .addCase(executeJevAction.rejected, (state, action) => {
        state.isExecuting = false;
        const message = action.payload ?? action.error.message ?? 'Could not set clock action.';
        Toast.show({ type: 'error', text1: 'Error', text2: message });
      });
  },
});

export const { setJevDebug } = requestSlice.actions;

export default requestSlice.reducer;
