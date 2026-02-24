import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// ── Async thunk: fetch AI insights from backend ────────────────────────────
export const fetchInsights = createAsyncThunk(
    'insights/fetch',
    async (uid, { rejectWithValue }) => {
        try {
            const response = await api.get(`/insights/${uid}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404 || error.response?.status === 503) {
                // Engine not set up yet — return graceful fallback
                return {
                    summary: 'Keep learning and earning XP!',
                    weak_area: null,
                    recommendation: 'Complete your homework to earn bonus XP.',
                    motivation: 'Every step counts! 🌟',
                    score: 50,
                    trend: 'stable',
                    badge_hint: null,
                    xp_summary: '',
                    homework_status: '',
                    game_feedback: '',
                    streak_status: '',
                    generated_at: new Date().toISOString(),
                };
            }
            return rejectWithValue(error.message);
        }
    }
);

// ── Async thunk: fetch performance analytics ───────────────────────────────
export const fetchAnalytics = createAsyncThunk(
    'insights/fetchAnalytics',
    async (uid, { rejectWithValue }) => {
        try {
            const response = await api.get(`/analytics/performance/${uid}`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return {
                    xp_timeline: [],
                    source_breakdown: [],
                    weekly_progress: [],
                    subject_scores: {},
                    current_stats: {},
                };
            }
            return rejectWithValue(error.message);
        }
    }
);

// ── Async thunk: trigger gamification event ────────────────────────────────
export const triggerGamificationEvent = createAsyncThunk(
    'insights/triggerEvent',
    async ({ uid, event_type, payload }, { rejectWithValue }) => {
        try {
            const response = await api.post('/gamification/process', {
                uid,
                event_type,
                payload: payload || {},
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// ── Slice ──────────────────────────────────────────────────────────────────
const insightsSlice = createSlice({
    name: 'insights',
    initialState: {
        // AI insight card data
        data: null,
        loading: false,
        error: null,
        lastFetchedUid: null,

        // Analytics charts data
        analytics: {
            xp_timeline: [],
            source_breakdown: [],
            weekly_progress: [],
            subject_scores: {},
            current_stats: {},
        },
        analyticsLoading: false,
        analyticsError: null,

        // Gamification event processing
        lastEventResult: null,
        eventProcessing: false,
    },
    reducers: {
        clearInsights: (state) => {
            state.data = null;
            state.error = null;
        },
        clearAnalytics: (state) => {
            state.analytics = {
                xp_timeline: [],
                source_breakdown: [],
                weekly_progress: [],
                subject_scores: {},
                current_stats: {},
            };
        },
    },
    extraReducers: (builder) => {
        builder
            // ── fetchInsights ──────────────────────────────────────────────
            .addCase(fetchInsights.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInsights.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
                state.lastFetchedUid = action.meta.arg;
            })
            .addCase(fetchInsights.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Failed to fetch insights';
            })

            // ── fetchAnalytics ─────────────────────────────────────────────
            .addCase(fetchAnalytics.pending, (state) => {
                state.analyticsLoading = true;
                state.analyticsError = null;
            })
            .addCase(fetchAnalytics.fulfilled, (state, action) => {
                state.analyticsLoading = false;
                state.analytics = action.payload;
            })
            .addCase(fetchAnalytics.rejected, (state, action) => {
                state.analyticsLoading = false;
                state.analyticsError = action.payload || 'Failed to fetch analytics';
            })

            // ── triggerGamificationEvent ───────────────────────────────────
            .addCase(triggerGamificationEvent.pending, (state) => {
                state.eventProcessing = true;
            })
            .addCase(triggerGamificationEvent.fulfilled, (state, action) => {
                state.eventProcessing = false;
                state.lastEventResult = action.payload;
            })
            .addCase(triggerGamificationEvent.rejected, (state) => {
                state.eventProcessing = false;
            });
    },
});

export const { clearInsights, clearAnalytics } = insightsSlice.actions;
export default insightsSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────
export const selectInsights = (state) => state.insights.data;
export const selectInsightsLoading = (state) => state.insights.loading;
export const selectAnalytics = (state) => state.insights.analytics;
export const selectAnalyticsLoading = (state) => state.insights.analyticsLoading;
export const selectLastEventResult = (state) => state.insights.lastEventResult;
