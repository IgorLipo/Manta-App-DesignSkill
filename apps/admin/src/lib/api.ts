import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
};

// ─── Jobs ────────────────────────────────────────────
export const jobsApi = {
  list: (params?: { status?: string; page?: number; limit?: number; search?: string }) =>
    api.get('/jobs', { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  sendInvite: (id: string) => api.post(`/jobs/${id}/invite`),
  validate: (id: string, decision: string, note?: string) =>
    api.post(`/jobs/${id}/validate`, { decision, note }),
  assign: (id: string, scaffolderId: string) =>
    api.post(`/jobs/${id}/assign`, { scaffolderId }),
  submitQuote: (id: string, data: { amount: number; notes?: string; proposedDate?: string }) =>
    api.post(`/jobs/${id}/quote`, data),
  startScheduling: (id: string) => api.post(`/jobs/${id}/scheduling/start`),
};

// ─── Files ────────────────────────────────────────────
export const filesApi = {
  uploadPhoto: (jobId: string, formData: FormData) =>
    api.post(`/files/photos/${jobId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getPhotos: (jobId: string) => api.get(`/files/photos/${jobId}`),
  approvePhoto: (photoId: string) => api.post(`/files/photos/${photoId}/approve`),
  rejectPhoto: (photoId: string, note: string) => api.post(`/files/photos/${photoId}/reject`, { note }),
};

// ─── Scheduling ───────────────────────────────────────
export const schedulingApi = {
  proposeDate: (jobId: string, proposedDate: string) =>
    api.post(`/scheduling/${jobId}/propose`, { proposedDate }),
  getSchedules: (jobId: string) => api.get(`/scheduling/${jobId}/schedules`),
};

// ─── Notifications ─────────────────────────────────────
export const notificationsApi = {
  list: (page = 1) => api.get('/notifications', { params: { page } }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// ─── Scaffolders ─────────────────────────────────────
export const scaffoldersApi = {
  list: (filters?: { regionId?: string }) => api.get('/users/scaffolders', { params: filters }),
};

// ─── Reports ─────────────────────────────────────────
export const reportsApi = {
  get: (jobId: string) => api.get(`/reports/${jobId}/report`),
  getPdf: (reportId: string) => api.get(`/reports/reports/${reportId}/pdf`),
};
