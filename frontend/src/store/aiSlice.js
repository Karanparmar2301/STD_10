import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const sendChatMessage = createAsyncThunk(
  'ai/sendChatMessage',
  async ({ uid, message }, { rejectWithValue }) => {
    try {
      const { apiService } = await import('../services/api');
      const res = await apiService.sendChatMessage({ uid, message });
      return res.data; // { reply, suggestions, timestamp, intent }
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.detail || 'Could not reach the assistant. Please try again.'
      );
    }
  }
);

export const loadHistory = createAsyncThunk(
  'ai/loadHistory',
  async (uid, { rejectWithValue }) => {
    try {
      const { apiService } = await import('../services/api');
      const res = await apiService.getChatHistory(uid);
      return res.data?.messages || [];
    } catch (err) {
      return rejectWithValue('Could not load chat history.');
    }
  }
);

// ─── Default suggestions ──────────────────────────────────────────────────────
const DEFAULT_SUGGESTIONS = [
  'Help me with math 🧮',
  'Check my progress 📊',
  'Which game gives the most XP? 🎮',
  'Homework tips 📚',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Slice ────────────────────────────────────────────────────────────────────
const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    messages: [],          // [{ id, role: 'user'|'assistant', content, timestamp }]
    isTyping: false,
    suggestions: DEFAULT_SUGGESTIONS,
    error: null,
    historyLoaded: false,
  },
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({
        id:        makeId(),
        role:      'user',
        content:   action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    clearChat: (state) => {
      state.messages      = [];
      state.suggestions   = DEFAULT_SUGGESTIONS;
      state.error         = null;
      state.historyLoaded = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── sendChatMessage ──────────────────────────────────────────────
    builder.addCase(sendChatMessage.pending, (state) => {
      state.isTyping = true;
      state.error    = null;
    });
    builder.addCase(sendChatMessage.fulfilled, (state, action) => {
      state.isTyping = false;
      const { reply, suggestions, timestamp } = action.payload;
      state.messages.push({
        id:        makeId(),
        role:      'assistant',
        content:   reply,
        timestamp: timestamp || new Date().toISOString(),
      });
      if (suggestions?.length) {
        state.suggestions = suggestions;
      }
    });
    builder.addCase(sendChatMessage.rejected, (state, action) => {
      state.isTyping = false;
      state.error    = action.payload;
      state.messages.push({
        id:        makeId(),
        role:      'assistant',
        content:   "😕 I couldn't connect right now. Check your internet and try again!",
        timestamp: new Date().toISOString(),
        isError:   true,
      });
    });

    // ── loadHistory ──────────────────────────────────────────────────
    builder.addCase(loadHistory.pending, (state) => {
      state.historyLoaded = false;
    });
    builder.addCase(loadHistory.fulfilled, (state, action) => {
      state.historyLoaded = true;
      if (!action.payload?.length) return;
      if (state.messages.length > 0) return; // don't overwrite live session
      state.messages = action.payload.map((m) => ({
        id:        makeId(),
        role:      m.role,
        content:   m.message,
        timestamp: m.timestamp,
      }));
    });
    builder.addCase(loadHistory.rejected, (state) => {
      state.historyLoaded = true;
    });
  },
});

// ─── Actions ──────────────────────────────────────────────────────────────────
export const { addUserMessage, clearChat, clearError } = aiSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectMessages      = (state) => state.ai.messages;
export const selectIsTyping      = (state) => state.ai.isTyping;
export const selectSuggestions   = (state) => state.ai.suggestions;
export const selectAIError       = (state) => state.ai.error;
export const selectHistoryLoaded = (state) => state.ai.historyLoaded;

export default aiSlice.reducer;
