import axios from 'axios';
import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth API
export const auth = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }).then((r) => r.data),

  register: (email, password, name) =>
    api.post('/api/auth/register', { email, password, name }).then((r) => r.data),

  getMe: () =>
    api.get('/api/auth/me').then((r) => r.data),

  deleteAccount: () =>
    api.delete('/api/auth/account').then((r) => r.data),
};

// Books API
export const books = {
  searchBooks: (query) =>
    api.get(`/api/books/search`, { params: { q: query } }).then((r) => r.data),

  getBook: (googleBooksId) =>
    api.get(`/api/books/${googleBooksId}`).then((r) => r.data),
};

// Library API
export const library = {
  getLibrary: () =>
    api.get('/api/library').then((r) => r.data),

  addToLibrary: (bookData) =>
    api.post('/api/library', bookData).then((r) => r.data),

  updateLibraryEntry: (entryId, status) =>
    api.patch(`/api/library/${entryId}`, { status }).then((r) => r.data),

  removeFromLibrary: (entryId) =>
    api.delete(`/api/library/${entryId}`).then((r) => r.data),

  saveReview: (entryId, content, rating) =>
    api.post(`/api/library/${entryId}/review`, { content, rating }).then((r) => r.data),

  getReview: (entryId) =>
    api.get(`/api/library/${entryId}/review`).then((r) => r.data),
};

// Recommendations API
export const recommendations = {
  getRecommendations: (mode, input, limit = 10) =>
    api.post('/api/recommendations', { mode, input, limit }).then((r) => r.data),
};

// Trending API
export const trending = {
  getTrending: () =>
    api.get('/api/trending').then((r) => r.data),
};

export default api;
