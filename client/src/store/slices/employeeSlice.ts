import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { EmployeeState, Employee, OnboardingApplication, VisaStatus, OnboardingForm, ApiResponse } from '../../types';
import api from '../../services/api';

// Async thunks
export const fetchEmployeeProfile = createAsyncThunk(
  'employee/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.user.getProfile();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch profile';
      return rejectWithValue(message);
    }
  }
);

export const updateEmployeeProfile = createAsyncThunk(
  'employee/updateProfile',
  async ({ section, data }: { section: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await api.user.updateProfileSection(section, data);
      return { section, data: response.data };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

export const submitOnboardingApplication = createAsyncThunk(
  'employee/submitOnboarding',
  async (applicationData: OnboardingForm, { rejectWithValue }) => {
    try {
      const response = await api.onboarding.submit(applicationData);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to submit application';
      return rejectWithValue(message);
    }
  }
);

export const fetchOnboardingApplication = createAsyncThunk(
  'employee/fetchOnboarding',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.onboarding.getMyApplication();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch application';
      return rejectWithValue(message);
    }
  }
);

export const updateOnboardingApplication = createAsyncThunk(
  'employee/updateOnboarding',
  async (applicationData: OnboardingForm, { rejectWithValue }) => {
    try {
      const response = await api.onboarding.update(applicationData);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update application';
      return rejectWithValue(message);
    }
  }
);

export const fetchVisaStatus = createAsyncThunk(
  'employee/fetchVisaStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.visa.getStatus();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch visa status';
      return rejectWithValue(message);
    }
  }
);

export const uploadVisaDocument = createAsyncThunk(
  'employee/uploadVisaDocument',
  async ({ file, type }: { file: File; type: string }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await api.visa.uploadDocument(formData);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload document';
      return rejectWithValue(message);
    }
  }
);

export const uploadFile = createAsyncThunk(
  'employee/uploadFile',
  async ({ file, type }: { file: File; type: string }, { rejectWithValue }) => {
    try {
      const result = await api.uploadFile(file, type);
      return { type, ...result };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to upload file';
      return rejectWithValue(message);
    }
  }
);

export const downloadFile = createAsyncThunk(
  'employee/downloadFile',
  async (filename: string, { rejectWithValue }) => {
    try {
      const blob = await api.downloadFile(filename);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { filename };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to download file';
      return rejectWithValue(message);
    }
  }
);

const initialState: EmployeeState = {
  profile: null,
  onboardingApplication: null,
  visaStatus: null,
  documents: [],
  loading: false,
  error: null,
};

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateProfileField: (state, action: PayloadAction<{ field: string; value: any }>) => {
      if (state.profile) {
        (state.profile as any)[action.payload.field] = action.payload.value;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch employee profile
      .addCase(fetchEmployeeProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(fetchEmployeeProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update employee profile
      .addCase(updateEmployeeProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployeeProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the specific section in the profile
        if (state.profile) {
          const { section, data } = action.payload;
          (state.profile as any)[section] = { ...((state.profile as any)[section] || {}), ...data };
        }
      })
      .addCase(updateEmployeeProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Submit onboarding application
      .addCase(submitOnboardingApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitOnboardingApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.onboardingApplication = action.payload;
        state.error = null;
      })
      .addCase(submitOnboardingApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch onboarding application
      .addCase(fetchOnboardingApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOnboardingApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.onboardingApplication = action.payload;
        state.error = null;
      })
      .addCase(fetchOnboardingApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update onboarding application
      .addCase(updateOnboardingApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOnboardingApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.onboardingApplication = action.payload;
        state.error = null;
      })
      .addCase(updateOnboardingApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch visa status
      .addCase(fetchVisaStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisaStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.visaStatus = action.payload;
        state.error = null;
      })
      .addCase(fetchVisaStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Upload visa document
      .addCase(uploadVisaDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadVisaDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Refresh visa status after upload
      })
      .addCase(uploadVisaDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Download file
      .addCase(downloadFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadFile.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(downloadFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateProfileField } = employeeSlice.actions;
export default employeeSlice.reducer; 