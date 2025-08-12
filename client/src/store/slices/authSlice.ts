import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User, LoginForm, RegistrationForm, ApiResponse } from '../../types';
import api from '../../services/api';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await api.auth.login(credentials);
      const { token, user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      
      return { user, token };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ registrationData, token }: { registrationData: any; token: string }, { rejectWithValue }) => {
    try {
      const response = await api.auth.register({
        ...registrationData,
        token,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await api.auth.me();
      return response.data.user;
    } catch (error: any) {
      localStorage.removeItem('authToken');
      const message = error.response?.data?.message || 'Token verification failed';
      return rejectWithValue(message);
    }
  }
);

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isAuthenticated: false,
  loading: false,
  error: null,
  registrationSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('authToken');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.registrationSuccess = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearRegistrationSuccess: (state) => {
      state.registrationSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Register user
      .addCase(registerUser.pending, (state) => {
        console.log('🔄 Registration pending...');
        state.loading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        console.log('✅ Registration fulfilled with payload:', action.payload);
        state.loading = false;
        state.error = null;
        state.registrationSuccess = true;
        // Important: Do NOT set isAuthenticated to true here 
        // User needs to login separately after registration
        console.log('🎯 Registration success state set to:', state.registrationSuccess);
      })
      .addCase(registerUser.rejected, (state, action) => {
        console.log('❌ Registration rejected with error:', action.payload);
        state.loading = false;
        state.error = action.payload as string;
        state.registrationSuccess = false;
      })
      
      // Verify token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, clearRegistrationSuccess } = authSlice.actions;
export default authSlice.reducer; 