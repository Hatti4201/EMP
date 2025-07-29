import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // 🔐 1️⃣ Authentication & Registration Module
  auth = {
    // Generate registration token (HR only)
    generateToken: (data: { email: string; name?: string }) =>
      this.api.post('/hr/token', data),

    // Employee registration
    register: (data: { token: string; username: string; password: string }) =>
      this.api.post('/auth/register', data),

    // Login (Employee/HR)
    login: (data: { username: string; password: string }) =>
      this.api.post('/auth/login', data),

    // Get current user info
    me: () => this.api.get('/auth/me'),
  };

  // 👤 2️⃣ Employee Personal Information Module
  user = {
    // Get personal profile
    getProfile: () => this.api.get('/user/profile'),

    // Update profile section
    updateProfileSection: (sectionName: string, sectionData: any) =>
      this.api.put(`/user/profile/section/${sectionName}`, sectionData),
  };

  // 📝 3️⃣ Onboarding Application Module
  onboarding = {
    // Submit onboarding application
    submit: (data: any) => this.api.post('/onboarding', data),

    // Get my application status
    getMyApplication: () => this.api.get('/onboarding/me'),

    // Edit/update application
    update: (data: any) => this.api.put('/onboarding', data),
  };

  // 📁 4️⃣ File Upload/Download Module
  files = {
    // Upload file
    upload: (formData: FormData) =>
      this.api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),

    // Download/preview file
    download: (filename: string) => this.api.get(`/files/${filename}`, {
      responseType: 'blob',
    }),

    // Get file URL for preview
    getFileUrl: (filename: string) => 
      `${this.api.defaults.baseURL}/files/${filename}`,
  };

  // 🛂 5️⃣ Visa Status Management Module
  visa = {
    // Get visa status
    getStatus: () => this.api.get('/visa-status'),

    // Upload visa document
    uploadDocument: (formData: FormData) =>
      this.api.post('/visa-status/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
  };

  // 👩‍💼 6️⃣ HR Management Module
  hr = {
    // 📊 Dashboard & Statistics
    getDashboardStats: () => this.api.get('/hr/dashboard/stats'),

    // 👥 Employee Management
    employees: {
      // Get all employees
      getAll: () => this.api.get('/hr/employees'),

      // Get employee details
      getById: (id: string) => this.api.get(`/hr/employees/${id}`),

      // Search employees
      search: (query: string) => this.api.get(`/hr/employees?search=${encodeURIComponent(query)}`),
    },

    // 📝 Onboarding Application Management
    applications: {
      // Get applications by status
      getByStatus: (status?: string) => {
        const url = status ? `/hr/applications?status=${status}` : '/hr/applications';
        return this.api.get(url);
      },

      // Get all pending applications
      getPending: () => this.api.get('/hr/applications?status=pending'),

      // Get all rejected applications  
      getRejected: () => this.api.get('/hr/applications?status=rejected'),

      // Get all approved applications
      getApproved: () => this.api.get('/hr/applications?status=approved'),

      // Review/approve application
      review: (id: string, data: { status: 'approved' | 'rejected'; feedback?: string }) =>
        this.api.put(`/hr/onboarding/${id}`, data),
    },

    // 📋 Registration Token Management
    tokens: {
      // Get all registration tokens
      getAll: () => this.api.get('/hr/tokens'),

      // Generate new registration token
      generate: (data: { email: string; name?: string }) =>
        this.api.post('/hr/token', data),
    },

    // 🛂 Visa Document Management
    documents: {
      // Review/approve visa document
      review: (employeeId: string, data: { type: string; status: 'approved' | 'rejected'; feedback?: string }) =>
        this.api.put(`/hr/document/${employeeId}`, data),

      // Send notification email
      sendNotification: (employeeId: string, data: { type: string }) =>
        this.api.post(`/hr/notification/${employeeId}`, data),
    },
  };

  // Generic HTTP methods for backward compatibility
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch(url, data, config);
    return response.data;
  }

  // File upload helper
  async uploadFile(file: File, type: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await this.files.upload(formData);
    return response.data;
  }

  // File download helper
  async downloadFile(filename: string): Promise<Blob> {
    const response = await this.files.download(filename);
    return response.data;
  }
}

const api = new ApiService();
export default api; 