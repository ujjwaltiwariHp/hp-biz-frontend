import { apiClient } from '@/lib/api';
import { SuperAdminNotification, NotificationListResponse, UnreadCountResponse } from '@/types/notification';

const BASE_URL = '/notifications';
const SA_BASE_URL = '/super-admin/notifications';

export const notificationService = {

  getAllNotifications: async (
    page: number = 1,
    limit: number = 10,
    filters: Record<string, string | number | boolean | undefined> = {}
  ): Promise<NotificationListResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get(
      `${SA_BASE_URL}?${params.toString()}`
    );

    if (response.data.data && Array.isArray(response.data.data.notifications)) {
        return response.data.data;
    }

    return { notifications: [], pagination: { totalCount: 0, totalPages: 0, currentPage: 1 } };
  },

  getCompanyUnreadCount: async (): Promise<UnreadCountResponse> => {
    try {
      const response = await apiClient.get(`${BASE_URL}/unread-count`);
      return response.data;
    } catch (error: any) {
      return { unread_count: 0 };
    }
  },

  getSuperAdminUnreadCount: async () => {
    try {
      const response = await apiClient.get(`${SA_BASE_URL}/stats`);
      return response.data;
    } catch (error: any) {
      return { stats: { unread_notifications: 0 }, unread_count: 0 };
    }
  },

  markAsRead: async (id: number): Promise<SuperAdminNotification> => {
    const response = await apiClient.put(`${SA_BASE_URL}/${id}/mark-read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put(`${SA_BASE_URL}/mark-all-read`);
  },

  deleteNotification: async (id: number): Promise<void> => {
    await apiClient.delete(`${SA_BASE_URL}/${id}`);
  },

  clearAllNotifications: async (): Promise<void> => {
    await apiClient.delete(`${SA_BASE_URL}`);
  },

};
