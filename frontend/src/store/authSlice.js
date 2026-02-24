import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from '../services/supabase';

// Async thunks
export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const data = await auth.signIn(email, password);
            const { user, session } = data;

            if (!user.email_confirmed_at) {
                throw new Error('Email not verified');
            }

            return {
                uid: user.id,
                email: user.email,
                token: session.access_token,
                emailVerified: !!user.email_confirmed_at
            };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const signupUser = createAsyncThunk(
    'auth/signup',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            await auth.signUp(email, password);
            return { success: true };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await auth.signOut();
            return null;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const checkSession = createAsyncThunk(
    'auth/checkSession',
    async (_, { rejectWithValue }) => {
        try {
            const session = await auth.getSession();
            if (session && session.user) {
                return {
                    uid: session.user.id,
                    email: session.user.email,
                    token: session.access_token,
                    emailVerified: !!session.user.email_confirmed_at
                };
            }
            return null;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        isAuthChecked: false
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = !!action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.token = action.payload.token;
                state.isAuthenticated = true;
                // Store token in localStorage for API calls
                localStorage.setItem('authToken', action.payload.token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Signup
            .addCase(signupUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signupUser.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(signupUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                // Remove token from localStorage
                localStorage.removeItem('authToken');
            })
            // Check Session
            .addCase(checkSession.fulfilled, (state, action) => {
                state.isAuthChecked = true;
                if (action.payload) {
                    state.user = action.payload;
                    state.token = action.payload.token;
                    state.isAuthenticated = true;
                    // Store token in localStorage for API calls
                    localStorage.setItem('authToken', action.payload.token);
                }
            })
            .addCase(checkSession.rejected, (state) => {
                state.isAuthChecked = true;
            });
    }
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
