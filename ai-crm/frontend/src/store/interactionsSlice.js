import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Async thunks (functions that call the API)
export const fetchInteractions = createAsyncThunk(
  'interactions/fetchAll',
  async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/interactions?${params}`);
    return response.data;
  }
);

export const createInteraction = createAsyncThunk(
  'interactions/create',
  async (interactionData) => {
    const response = await axios.post(`${API_URL}/interactions`, interactionData);
    return response.data;
  }
);

export const updateInteraction = createAsyncThunk(
  'interactions/update',
  async ({ id, data }) => {
    const response = await axios.put(`${API_URL}/interactions/${id}`, data);
    return response.data;
  }
);

export const deleteInteraction = createAsyncThunk(
  'interactions/delete',
  async (id) => {
    await axios.delete(`${API_URL}/interactions/${id}`);
    return id;
  }
);

export const sendChatMessage = createAsyncThunk(
  'interactions/chat',
  async ({ message, conversationHistory }) => {
    const response = await axios.post(`${API_URL}/chat`, {
      message,
      conversation_history: conversationHistory
    });
    return response.data;
  }
);

// Slice
const interactionsSlice = createSlice({
  name: 'interactions',
  initialState: {
    list: [],
    currentInteraction: null,
    loading: false,
    error: null,
    chatMessages: [],
    chatLoading: false,
    activeTab: 'form', // 'form' or 'chat'
  },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    addChatMessage: (state, action) => {
      state.chatMessages.push(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentInteraction: (state, action) => {
      state.currentInteraction = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch interactions
    builder
      .addCase(fetchInteractions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // Create interaction
    builder
      .addCase(createInteraction.pending, (state) => {
        state.loading = true;
      })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.list.unshift(action.payload);
      })
      .addCase(createInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    // Update interaction
    builder.addCase(updateInteraction.fulfilled, (state, action) => {
      const index = state.list.findIndex(i => i.id === action.payload.id);
      if (index !== -1) state.list[index] = action.payload;
    });

    // Delete interaction
    builder.addCase(deleteInteraction.fulfilled, (state, action) => {
      state.list = state.list.filter(i => i.id !== action.payload);
    });

    // Chat
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.chatLoading = true;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.chatMessages.push({
          role: 'assistant',
          content: action.payload.response
        });
        // If a new interaction was logged via chat, add to list
        if (action.payload.logged_interaction_id) {
          // Will be refreshed by fetchInteractions
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatMessages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        });
      });
  }
});

export const { setActiveTab, addChatMessage, clearError, setCurrentInteraction } = interactionsSlice.actions;
export default interactionsSlice.reducer;
