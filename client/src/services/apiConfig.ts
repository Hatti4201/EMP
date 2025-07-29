// API Configuration and Constants

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication & Registration
  AUTH: {
    GENERATE_TOKEN: '/hr/token',
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },

  // User/Employee Profile
  USER: {
    PROFILE: '/user/profile',
    PROFILE_SECTION: (section: string) => `/user/profile/section/${section}`,
  },

  // Onboarding Application
  ONBOARDING: {
    SUBMIT: '/onboarding',
    MY_APPLICATION: '/onboarding/me',
    UPDATE: '/onboarding',
  },

  // File Management
  FILES: {
    UPLOAD: '/upload',
    DOWNLOAD: (filename: string) => `/files/${filename}`,
  },

  // Visa Status Management
  VISA: {
    STATUS: '/visa-status',
    UPLOAD: '/visa-status/upload',
  },

  // HR Management
  HR: {
    // Dashboard
    DASHBOARD_STATS: '/hr/dashboard/stats',

    // Employee Management
    EMPLOYEES: '/hr/employees',
    EMPLOYEE_BY_ID: (id: string) => `/hr/employees/${id}`,
    EMPLOYEE_SEARCH: (query: string) => `/hr/employees?search=${encodeURIComponent(query)}`,

    // Application Management
    APPLICATIONS: '/hr/applications',
    APPLICATIONS_BY_STATUS: (status?: string) => 
      status ? `/hr/applications?status=${status}` : '/hr/applications',
    APPLICATIONS_PENDING: '/hr/applications?status=pending',
    APPLICATIONS_REJECTED: '/hr/applications?status=rejected',
    APPLICATIONS_APPROVED: '/hr/applications?status=approved',
    APPLICATION_REVIEW: (id: string) => `/hr/onboarding/${id}`,

    // Token Management
    TOKENS: '/hr/tokens',
    TOKEN_GENERATE: '/hr/token',

    // Document Management
    DOCUMENT_REVIEW: (employeeId: string) => `/hr/document/${employeeId}`,
    NOTIFICATION: (employeeId: string) => `/hr/notification/${employeeId}`,
  },
} as const;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Request Headers
export const REQUEST_HEADERS = {
  JSON: {
    'Content-Type': 'application/json',
  },
  MULTIPART: {
    'Content-Type': 'multipart/form-data',
  },
} as const;

// Section names for profile updates
export const PROFILE_SECTIONS = {
  NAME: 'name',
  ADDRESS: 'address', 
  CONTACT: 'contact',
  VISA: 'visa',
  EMERGENCY: 'emergency',
  DOCUMENTS: 'documents',
} as const;

// Document types
export const DOCUMENT_TYPES = {
  PROFILE_PICTURE: 'profile-picture',
  DRIVERS_LICENSE: 'drivers-license',
  WORK_AUTHORIZATION: 'work-authorization',
  OPT_RECEIPT: 'opt-receipt',
  OPT_EAD: 'opt-ead',
  I983: 'i983',
  I20: 'i20',
} as const;

// Application status types
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Visa workflow steps
export const VISA_STEPS = {
  OPT_RECEIPT: 'opt-receipt',
  OPT_EAD: 'opt-ead',
  I983: 'i983',
  I20: 'i20',
  COMPLETED: 'completed',
} as const; 