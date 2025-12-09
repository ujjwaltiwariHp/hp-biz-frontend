'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { notificationService } from '@/services/notification.service';
import { invoiceService } from '@/services/invoice.service';
import { SuperAdminNotification } from '@/types/notification';
import { toast } from 'react-toastify';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useSSE } from '@/hooks/useSSE';

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'normal'>('all');

  const queryFilters = { is_read: false };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['superAdminNotifications', page, limit, queryFilters],
    queryFn: () => notificationService.getAllNotifications(page, limit, queryFilters),
    retry: 2,
    staleTime: 30000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['notifications', 'unreadCount', true],
    queryFn: notificationService.getSuperAdminUnreadCount,
    refetchInterval: 60000,
  });

  useSSE('new_sa_notification', ['superAdminNotifications', page, limit, queryFilters]);
  useSSE('new_sa_notification', ['notifications', 'unreadCount', true]);

  const approveDialog = useConfirmDialog();
  const rejectDialog = useConfirmDialog();
  const [selectedNotification, setSelectedNotification] = useState<SuperAdminNotification | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { mutate: markAsReadMutate } = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount', true] });
      toast.success('Notification marked as read');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to mark as read');
    },
  });

  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount', true] });
      toast.success('All notifications marked as read');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to mark all as read');
    },
  });

  const approveSubscriptionMutation = useMutation({
    mutationFn: (companyId: number) => {
      const subId =
        selectedNotification?.metadata?.subscription_id ||
        selectedNotification?.metadata?.subscriptionId ||
        0;
      return invoiceService.approveSubscription(companyId, subId, {
        invoice_id: selectedNotification?.metadata?.invoice_id || 0,
        start_date_override: selectedNotification?.updated_at || '',
      });
    },
    onSuccess: () => {
      toast.success('Subscription approved successfully');
      if (selectedNotification?.id) markAsReadMutate(selectedNotification.id);
      queryClient.invalidateQueries({ queryKey: ['superAdminNotifications'] });
      approveDialog.closeDialog();
      setSelectedNotification(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Approval failed'),
  });

  const rejectSubscriptionMutation = useMutation({
    mutationFn: (companyId: number) =>
      invoiceService.rejectSubscription(companyId, {
        invoice_id: selectedNotification?.metadata?.invoice_id || 0,
        rejection_reason: rejectReason || 'Not specified',
      }),
    onSuccess: () => {
      toast.success('Subscription rejected successfully');
      if (selectedNotification?.id) markAsReadMutate(selectedNotification.id);
      queryClient.invalidateQueries({ queryKey: ['superAdminNotifications'] });
      rejectDialog.closeDialog();
      setSelectedNotification(null);
      setRejectReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Rejection failed'),
  });

  const handleApprove = (n: SuperAdminNotification) => {
    if (!n.metadata?.company_id) return toast.error('Company ID missing');
    setSelectedNotification(n);
    approveDialog.openDialog();
  };

  const handleReject = (n: SuperAdminNotification) => {
    if (!n.metadata?.company_id) return toast.error('Company ID missing');
    setSelectedNotification(n);
    setRejectReason('');
    rejectDialog.openDialog();
  };

  const confirmApprove = () => {
    if (!selectedNotification?.metadata?.company_id) return toast.error('Company ID required');
    approveSubscriptionMutation.mutate(selectedNotification.metadata.company_id);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) return toast.error('Enter rejection reason');
    if (!selectedNotification?.metadata?.company_id) return toast.error('Company ID required');
    rejectSubscriptionMutation.mutate(selectedNotification.metadata.company_id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'payment_received':
      case 'subscription_activated':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'invoice_overdue':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-blue-500" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 font-semibold';
      case 'normal':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
  const normalized = notifications.map((n) => ({
    ...n,
    priority:
      n.notification_type === 'payment_pending' ||
      n.notification_type === 'invoice_overdue'
        ? 'high'
        : (n.priority as 'low' | 'normal' | 'high') || 'normal',
  }));

  const filtered =
    priorityFilter === 'all'
      ? normalized
      : normalized.filter((n) => n.priority === priorityFilter);

  const totalPages = Math.ceil((data?.pagination?.totalCount || 0) / limit);

  const unreadCount = (() => {
    const raw = statsData as any;
    const payload = raw?.data || raw;
    return payload?.stats?.unread_notifications || payload?.unread_count || 0;
  })();

  if (isLoading)
    return (
      <DefaultLayout>
        <Breadcrumb pageName=" Notifications" />
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );

  if (error)
    return (
      <DefaultLayout>
        <Breadcrumb pageName="Notifications" />
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-gray-600 mb-4">Failed to load notifications</p>
          <button
            onClick={() => refetch()}
            className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <RefreshCw size={16} className="inline mr-2" />
            Retry
          </button>
        </div>
      </DefaultLayout>
    );

  return (
    <DefaultLayout>
      <Breadcrumb pageName=" Notifications" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'high', 'normal'].map((level) => (
            <button
              key={level}
              onClick={() => setPriorityFilter(level as any)}
              className={`px-4 py-1.5 rounded-md border text-sm font-medium transition ${
                priorityFilter === level
                  ? 'bg-primary text-white border-primary'
                  : 'hover:bg-gray-100 border-gray-300 dark:border-gray-600'
              }`}
            >
              {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              disabled={isMarkingAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition"
            >
              <CheckSquare size={16} />
              <span className="hidden sm:inline">Mark All Read</span>
            </button>
          )}

          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
            title="Refresh"
          >
            <RefreshCw size={20} className="text-primary" />
          </button>

          {unreadCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium text-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">All caught up!</div>
        ) : (
          filtered.map((n) => {
            const isActionable = n.notification_type === 'payment_received';
            return (
              <div
                key={n.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-l-4 rounded-md bg-white dark:bg-boxdark shadow-sm ${
                  n.is_read ? 'opacity-60 border-gray-300' : 'border-primary'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="mt-1 sm:mt-0">{getNotificationIcon(n.notification_type)}</div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{n.title}</p>
                    <p className="text-sm text-primary">{n.metadata?.company_name}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                    <p className={`text-xs mt-1 ${getPriorityColor(n.priority)}`}>
                      {n.priority.toUpperCase()} PRIORITY
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                  {n.metadata?.invoice_id && (
                    <Link
                      href={`/invoices?invoice_id=${n.metadata.invoice_id}`}
                      className="px-3 py-1 bg-primary text-white text-xs rounded hover:bg-primary/90 flex items-center gap-1"
                    >
                      <Eye size={14} /> View
                    </Link>
                  )}

                  {isActionable && (
                    <>
                      <button
                        onClick={() => handleApprove(n)}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(n)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center gap-1"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  )}

                  {!n.is_read && (
                    <button
                      onClick={() => markAsReadMutate(n.id)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-40 flex items-center gap-1 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-40 flex items-center gap-1 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      <ConfirmDialog
        {...approveDialog.confirmProps}
        type="success"
        title="Approve Subscription"
        message={`Are you sure you want to approve the subscription for "${selectedNotification?.metadata?.company_name}"?`}
        onConfirm={confirmApprove}
        confirmText="Approve"
        cancelText="Cancel"
        isLoading={approveSubscriptionMutation.isPending}
      />

      <ConfirmDialog
        {...rejectDialog.confirmProps}
        type="danger"
        title="Reject Subscription"
        message={`Are you sure you want to reject "${selectedNotification?.metadata?.company_name}"?`}
        onConfirm={confirmReject}
        confirmText="Reject"
        cancelText="Cancel"
        isLoading={rejectSubscriptionMutation.isPending}
      >
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full mt-2 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:border-primary"
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </DefaultLayout>
  );
};

export default NotificationsPage;