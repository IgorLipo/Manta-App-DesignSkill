import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // Ignore storage errors
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof api.defaults) & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          await SecureStore.setItemAsync('accessToken', data.accessToken);
          await SecureStore.setItemAsync('refreshToken', data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // Redirect to login on auth failure
        router.replace('/auth/login');
      }
    }

    // Reject with error for caller to handle
    return Promise.reject(error);
  }
);

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'Network error';
  }
  return 'An unexpected error occurred';
}

// Auth API
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: 'OWNER' | 'SCAFFOLDER' | 'ENGINEER';
  }) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  sendMagicLink: (email: string) => api.post('/auth/magic-link', { email }),
  verifyMagicLink: (token: string) => api.post('/auth/verify-magic-link', { token }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// Jobs API - role-aware queries
export const jobsApi = {
  // Get jobs filtered by current user role (uses JWT to determine user)
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/jobs', { params }),
  // Get single job by ID
  get: (id: string) => api.get(`/jobs/${id}`),
  // Owner submits property details and photos
  submitOwner: (id: string, data: {
    location: { latitude: number; longitude: number };
    photos: string[];
    address: string;
    postcode: string;
  }) => api.post(`/jobs/${id}/submit`, data),
  // Scaffolder submits quote
  submitQuote: (id: string, data: {
    amount: number;
    startDate: string;
    endDate: string;
    notes: string;
  }) => api.post(`/jobs/${id}/quote`, data),
  // Owner confirms schedule
  confirmSchedule: (id: string) => api.post(`/jobs/${id}/schedule/confirm`),
  // Owner requests schedule change
  requestScheduleChange: (id: string, reason: string) => api.post(`/jobs/${id}/schedule/change`, { reason }),
  // Scaffolder marks unavailable
  markUnavailable: (id: string, reason: string) => api.post(`/jobs/${id}/schedule/unavailable`, { reason }),
  // Scaffolder responds to schedule
  respondToSchedule: (id: string, response: 'confirm' | 'reschedule' | 'unavailable', data?: { reason?: string; proposedDate?: string }) =>
    api.post(`/jobs/${id}/schedule/respond`, { response, ...data }),
  // Scaffolder marks scaffold complete
  markScaffoldComplete: (id: string, data?: { photos?: string[]; notes?: string }) =>
    api.post(`/jobs/${id}/scaffold-complete`, data),
  // Get job schedule details
  getSchedule: (id: string) => api.get(`/jobs/${id}/schedule`),
};

// Files/Photos API
export const filesApi = {
  uploadPhoto: (jobId: string, category: string, formData: FormData) =>
    api.post(`/files/photos/${jobId}/${category}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadMultiple: (jobId: string, formData: FormData) =>
    api.post(`/files/photos/${jobId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Reports API
export const reportsApi = {
  list: () => api.get('/reports'),
  get: (id: string) => api.get(`/reports/${id}`),
  getByJob: (jobId: string) => api.get(`/reports/job/${jobId}`),
  saveDraft: (jobId: string, data: any) => api.post(`/reports/${jobId}/draft`, data),
  submit: (reportId: string) => api.post(`/reports/${reportId}/submit`),
};

// Notifications API
export const notificationsApi = {
  list: (page = 1) => api.get('/notifications', { params: { page } }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};

export default api;
