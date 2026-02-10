import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const importAPI = {
  trigger: () => api.post('/import/trigger'),
  getHistory: (params?: any) => api.get('/import/history', { params }),
  getById: (id: string) => api.get(`/import/history/${id}`),
  getStats: () => api.get('/import/stats'),
};
