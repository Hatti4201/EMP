import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { HRState, Employee, RegistrationToken, OnboardingApplication, HRDashboardStats, ApiResponse } from '../../types';
import api from '../../services/api';

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'hr/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.hr.getDashboardStats();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch dashboard stats';
      return rejectWithValue(message);
    }
  }
);

export const fetchAllEmployees = createAsyncThunk(
  'hr/fetchAllEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.hr.employees.getAll();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch employees';
      return rejectWithValue(message);
    }
  }
);

export const searchEmployees = createAsyncThunk(
  'hr/searchEmployees',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.hr.employees.search(query);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to search employees';
      return rejectWithValue(message);
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  'hr/fetchEmployeeById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.hr.employees.getById(id);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch employee';
      return rejectWithValue(message);
    }
  }
);

export const generateRegistrationToken = createAsyncThunk(
  'hr/generateRegistrationToken',
  async (data: { email: string; name?: string }, { rejectWithValue }) => {
    try {
      const response = await api.hr.tokens.generate(data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to generate token';
      return rejectWithValue(message);
    }
  }
);

export const fetchRegistrationTokens = createAsyncThunk(
  'hr/fetchRegistrationTokens',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.hr.tokens.getAll();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch tokens';
      return rejectWithValue(message);
    }
  }
);

export const fetchPendingApplications = createAsyncThunk(
  'hr/fetchPendingApplications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.hr.applications.getPending();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch applications';
      return rejectWithValue(message);
    }
  }
);

export const fetchApplicationsByStatus = createAsyncThunk(
  'hr/fetchApplicationsByStatus',
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const response = await api.hr.applications.getByStatus(status);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch applications';
      return rejectWithValue(message);
    }
  }
);

export const reviewOnboardingApplication = createAsyncThunk(
  'hr/reviewOnboardingApplication',
  async ({ applicationId, status, feedback }: { 
    applicationId: string; 
    status: 'approved' | 'rejected'; 
    feedback?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await api.hr.applications.review(applicationId, { status, feedback });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to review application';
      return rejectWithValue(message);
    }
  }
);

export const reviewVisaDocument = createAsyncThunk(
  'hr/reviewVisaDocument',
  async ({ employeeId, documentType, status, feedback }: { 
    employeeId: string; 
    documentType: string; 
    status: 'approved' | 'rejected'; 
    feedback?: string 
  }, { rejectWithValue }) => {
    try {
      const response = await api.hr.documents.review(employeeId, { 
        type: documentType, 
        status, 
        feedback 
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to review document';
      return rejectWithValue(message);
    }
  }
);

export const sendNotificationEmail = createAsyncThunk(
  'hr/sendNotificationEmail',
  async ({ employeeId, type }: { employeeId: string; type: string }, { rejectWithValue }) => {
    try {
      const response = await api.hr.documents.sendNotification(employeeId, { type });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send notification';
      return rejectWithValue(message);
    }
  }
);

const initialState: HRState = {
  employees: [],
  selectedEmployee: null,
  registrationTokens: [],
  pendingApplications: [],
  dashboardStats: null,
  loading: false,
  error: null,
};

const hrSlice = createSlice({
  name: 'hr',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.selectedEmployee = action.payload;
    },
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch all employees
      .addCase(fetchAllEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
        state.error = null;
      })
      .addCase(fetchAllEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Search employees
      .addCase(searchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
        state.error = null;
      })
      .addCase(searchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch employee by ID
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEmployee = action.payload;
        state.error = null;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Generate registration token
      .addCase(generateRegistrationToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateRegistrationToken.fulfilled, (state, action) => {
        state.loading = false;
        state.registrationTokens = [action.payload, ...state.registrationTokens];
        state.error = null;
      })
      .addCase(generateRegistrationToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch registration tokens
      .addCase(fetchRegistrationTokens.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRegistrationTokens.fulfilled, (state, action) => {
        state.loading = false;
        state.registrationTokens = action.payload;
        state.error = null;
      })
      .addCase(fetchRegistrationTokens.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch pending applications
      .addCase(fetchPendingApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingApplications = action.payload;
        state.error = null;
      })
      .addCase(fetchPendingApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch applications by status
      .addCase(fetchApplicationsByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicationsByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingApplications = action.payload;
        state.error = null;
      })
      .addCase(fetchApplicationsByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Review onboarding application
      .addCase(reviewOnboardingApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewOnboardingApplication.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(reviewOnboardingApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Review visa document
      .addCase(reviewVisaDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reviewVisaDocument.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(reviewVisaDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Send notification email
      .addCase(sendNotificationEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendNotificationEmail.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendNotificationEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setSelectedEmployee, clearSelectedEmployee } = hrSlice.actions;
export default hrSlice.reducer; 