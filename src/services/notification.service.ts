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
    filters: Record<string, string | number> = {}
  ): Promise<NotificationListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
    return response.data.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get(`${BASE_URL}/stats`);
    return response.data.data;
  },
  markAsRead: async (id: number): Promise<SuperAdminNotification> => {
    const response = await apiClient.put(`${BASE_URL}/${id}/mark-read`);
    return response.data.data.notification;
  },
};