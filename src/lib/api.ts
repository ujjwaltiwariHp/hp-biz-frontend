import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, removeAuthToken, setAuthToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!config.headers['x-device-timezone']) {
        config.headers['x-device-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
                originalRequest.headers.Authorization = 'Bearer ' + token;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await apiClient.post('/super-admin/auth/refresh-token');

        const { token } = response.data.data;

        if (token) {
            setAuthToken(token);

            apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + token;
            processQueue(null, token);

            if (originalRequest.headers) {
                originalRequest.headers.Authorization = 'Bearer ' + token;
            }
            return apiClient(originalRequest);
        } else {
             throw new Error('No access token returned from refresh');
        }
      } catch (err) {
        processQueue(err, null);
        removeAuthToken();
        if (typeof window !== 'undefined' && window.location.pathname !== '/auth/signin') {
          window.location.href = '/auth/signin';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);