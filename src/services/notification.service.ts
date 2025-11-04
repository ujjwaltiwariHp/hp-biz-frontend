import { apiClient } from '@/lib/api';
import {
  SuperAdminNotification,
  NotificationListResponse,
  UnreadCountResponse
} from '@/types/notification';

const BASE_URL = '/super-admin/notifications';

export const notificationService = {

  getAllNotifications: async (
    page: number = 1,
    limit: number = 10,
    filters: Record<string, string | number | boolean | undefined> = {}
  ): Promise<NotificationListResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await apiClient.get(
        `${BASE_URL}?${params.toString()}`
      );

      if (!response.data) {
        return {
          notifications: [],
          pagination: { totalCount: 0, totalPages: 0, currentPage: 1 }
        };
      }

      if (Array.isArray(response.data)) {
        return {
          notifications: response.data,
          pagination: { totalCount: response.data.length, totalPages: 1, currentPage: 1 }
        };
      }

      if (response.data.data) {
        const dataObj = response.data.data;

        if (Array.isArray(dataObj)) {
          return {
            notifications: dataObj,
            pagination: { totalCount: dataObj.length, totalPages: 1, currentPage: 1 }
          };
        }

        if (dataObj.notifications && Array.isArray(dataObj.notifications)) {
          return {
            notifications: dataObj.notifications,
            pagination: dataObj.pagination || {
              totalCount: dataObj.notifications.length,
              totalPages: 1,
              currentPage: 1
            }
          };
        }

        return dataObj;
      }

      if (response.data.notifications && Array.isArray(response.data.notifications)) {
        return {
          notifications: response.data.notifications,
          pagination: response.data.pagination || {
            totalCount: response.data.notifications.length,
            totalPages: 1,
            currentPage: 1
          }
        };
      }

      return {
        notifications: [],
        pagination: { totalCount: 0, totalPages: 0, currentPage: 1 }
      };

    } catch (error: any) {
      if (error instanceof SyntaxError) {
        return {
          notifications: [],
          pagination: { totalCount: 0, totalPages: 0, currentPage: 1 }
        };
      }

      throw error;
    }
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    try {
      const response = await apiClient.get(`${BASE_URL}/stats`);

      if (response.data.data) {
        return response.data.data;
      }

      if (response.data.unread_count !== undefined) {
        return {
          unread_count: response.data.unread_count
        };
      }

      return response.data;
    } catch (error: any) {
      return { unread_count: 0 };
    }
  },

  markAsRead: async (id: number): Promise<SuperAdminNotification> => {
    try {
      const response = await apiClient.put(`${BASE_URL}/${id}/mark-read`);

      if (response.data.data?.notification) {
        return response.data.data.notification;
      }

      if (response.data.notification) {
        return response.data.notification;
      }

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.put(`${BASE_URL}/mark-all-read`);
    } catch (error: any) {
      throw error;
    }
  },

  deleteNotification: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`${BASE_URL}/${id}`);
    } catch (error: any) {
      throw error;
    }
  },

  clearAllNotifications: async (): Promise<void> => {
    try {
      await apiClient.delete(`${BASE_URL}`);
    } catch (error: any) {
      throw error;
    }
  },
};