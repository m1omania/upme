import axios, { AxiosInstance } from 'axios';
import type { ApiResponse } from '../../../shared/types';

// Автоматически определяем API URL в зависимости от того, где запущен frontend
function getApiUrl(): string {
  // Определяем по hostname (приоритет над env для мобильных устройств)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  
  // Production домен (upme.pro) - ВСЕГДА используем HTTPS через Nginx proxy
  // ВАЖНО: проверяем ПЕРВЫМ, даже если есть VITE_API_URL
  // НЕ добавляем /api здесь, так как методы уже содержат /api/
  if (hostname === 'upme.pro' || hostname.endsWith('.upme.pro')) {
    return `https://${hostname}`;
  }
  
  // Если указан явно в env - используем его (только для не-production доменов)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Если localhost - используем localhost:3002
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  
  // Если network IP (телефон в локальной сети) - используем тот же IP для backend
  // Это сработает только для IP адресов типа 192.168.x.x, 10.x.x.x и т.д.
  if (hostname.includes('.')) {
    // Проверяем что это не домен (домены содержат буквы)
    const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
    if (isIpAddress) {
      return `http://${hostname}:3002`;
    }
  }
  
  // По умолчанию localhost
  return 'http://localhost:3002';
}

const API_URL = getApiUrl();
if (typeof window !== 'undefined') {
  console.log('🔧 API Configuration:', {
    API_URL,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    fullURL: window.location.href,
    env_VITE_API_URL: import.meta.env.VITE_API_URL,
    isUpmePro: window.location.hostname === 'upme.pro',
  });
  
  // Дополнительная проверка для production
  if (window.location.hostname === 'upme.pro' && !API_URL.includes('https://upme.pro/api')) {
    console.error('❌ API URL mismatch! Expected https://upme.pro/api but got:', API_URL);
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем токен к каждому запросу
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API Request - Token added:', {
          url: config.url,
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...',
          hasAuthHeader: !!config.headers.Authorization
        });
      } else {
        console.warn('API Request - No token available:', config.url);
      }
      return config;
    });

    // Обработка ошибок
    this.client.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', {
          url: response.config.url,
          status: response.status,
          baseURL: response.config.baseURL,
        });
        return response;
      },
      (error) => {
        console.error('❌ API Error:', {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          isNetworkError: !error.response,
        });
        
        if (!error.response) {
          console.error('🌐 Network Error - Backend недоступен по адресу:', error.config?.baseURL);
          console.error('💡 Проверь что backend запущен и доступен по этому адресу');
        }
        
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          const currentPath = window.location.pathname;
          
          // НЕ удаляем токен, если:
          // 1. Это auth endpoint
          // 2. Мы на странице авторизации или callback
          // 3. Мы только что авторизовались (на странице /swipe менее 5 секунд назад)
          const isAuthEndpoint = url.includes('/auth/hh') || url.includes('/auth/callback');
          const isAuthPage = currentPath.includes('/auth');
          const isJustAfterAuth = currentPath === '/swipe' && sessionStorage.getItem('just_authenticated') === 'true';
          
          if (isAuthEndpoint || isAuthPage || isJustAfterAuth) {
            console.log('401 on auth-related page/endpoint, NOT clearing token:', { url, currentPath, isJustAfterAuth });
            return Promise.reject(error);
          }
          
          // Проверяем, есть ли токен в запросе - если нет, значит это не проблема токена
          const hadToken = error.config?.headers?.Authorization;
          if (!hadToken) {
            console.log('401 without token in request, NOT clearing token:', url);
            return Promise.reject(error);
          }
          
          console.warn('401 Unauthorized with token, clearing token:', url);
          localStorage.removeItem('token');
          // Используем window.location только если мы не на странице авторизации
          if (!isAuthPage) {
            window.location.href = '/';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  getAuthUrl: () => api.get<{ authUrl: string }>('/api/auth/hh'),
  devLogin: () => api.post<{ token: string }>('/api/auth/dev-login', {}),
};

// Vacancies API
export const vacanciesApi = {
  getRelevant: (page?: number) => api.get(`/api/vacancies/relevant?page=${page || 0}`),
  getById: (id: number) => api.get(`/api/vacancies/${id}`),
  calculateRelevance: (id: number) => api.post(`/api/vacancies/${id}/relevance`),
};

// Applications API
export const applicationsApi = {
  create: (data: { vacancy_id: number; cover_letter: string }) =>
    api.post('/api/applications', data),
  getAll: (limit?: number, offset?: number) =>
    api.get(`/api/applications?limit=${limit || 50}&offset=${offset || 0}`),
  getStats: () => api.get('/api/applications/stats'),
};

// AI API
export const aiApi = {
  generateLetter: (vacancy_id: number) =>
    api.post<{ letter: string }>('/api/ai/generate-letter', { vacancy_id }),
  improveLetter: (letter: string, feedback?: string) =>
    api.post<{ letter: string }>('/api/ai/improve-letter', { letter, feedback }),
};

// Gamification API
export const gamificationApi = {
  getStats: () => api.get('/api/gamification/stats'),
  getAchievements: () => api.get('/api/gamification/achievements'),
};

// User API
export const userApi = {
  getProfile: () => api.get('/api/user/profile'),
  updateFilters: (filters: any) => api.put('/api/user/filters', filters),
  getResume: () => api.get('/api/user/resume'),
  getHhInfo: () => api.get('/api/user/hh-info'),
  getBalance: () => api.get('/api/user/balance'),
};

