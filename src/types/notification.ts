export interface SuperAdminNotification {
  id: number;
  company_id: number;
  title: string;
  message: string;
  notification_type: 'payment_pending' | 'subscription_activated' | 'system_alert' | 'invoice_overdue' | string;
  priority: 'low' | 'normal' | 'high';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  metadata: {
    invoice_id?: number;
    company_name?: string;
    [key: string]: any;
  };
}

export interface NotificationListResponse {
  notifications: SuperAdminNotification[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface UnreadCountResponse {
  unread_count: number;
}