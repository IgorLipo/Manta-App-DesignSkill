import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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
      }
    }
    return Promise.reject(error);
  }
);

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

// Jobs API
export const jobsApi = {
  list: (params?: { status?: string; role?: string }) => api.get('/jobs', { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  getByRole: (role: string) => api.get('/jobs', { params: { role } }),
  submitOwner: (id: string, data: {
    location: { latitude: number; longitude: number };
    photos: string[];
    address: string;
    postcode: string;
  }) => api.post(`/jobs/${id}/submit`, data),
  submitQuote: (id: string, data: {
    amount: number;
    startDate: string;
    endDate: string;
    notes: string;
  }) => api.post(`/jobs/${id}/quote`, data),
  confirmSchedule: (id: string) => api.post(`/jobs/${id}/schedule/confirm`),
  requestScheduleChange: (id: string, reason: string) => api.post(`/jobs/${id}/schedule/change`, { reason }),
  markUnavailable: (id: string, reason: string) => api.post(`/jobs/${id}/schedule/unavailable`, { reason }),
  respondToSchedule: (id: string, response: 'confirm' | 'reschedule' | 'unavailable', data?: { reason?: string; proposedDate?: string }) =>
    api.post(`/jobs/${id}/schedule/respond`, { response, ...data }),
  markScaffoldComplete: (id: string, data?: { photos?: string[]; notes?: string }) =>
    api.post(`/jobs/${id}/scaffold-complete`, data),
  getSchedule: (id: string) => api.get(`/jobs/${id}/schedule`),
};

// Files API
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
