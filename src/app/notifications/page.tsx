'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import { notificationService } from '@/services/notification.service';
import { invoiceService } from '@/services/invoice.service';
import { SuperAdminNotification } from '@/types/notification';
import { toast } from 'react-toastify';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const [limit] = useState(10);

  const queryFilters = {
    is_read: false
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['superAdminNotifications', page, limit, queryFilters],
    queryFn: () => notificationService.getAllNotifications(page, limit, queryFilters),
    retry: 2,
    staleTime: 30000,
  });

  const approveDialog = useConfirmDialog();
  const rejectDialog = useConfirmDialog();
  const [selectedNotification, setSelectedNotification] = useState<SuperAdminNotification | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { mutate: markAsReadMutate } = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superAdminNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['superAdminNotificationsStats'] });
      toast.success('Notification marked as read');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark as read');
    },
  });

  const approveSubscriptionMutation = useMutation({
    mutationFn: (companyId: number) => {
      return invoiceService.approveSubscription(companyId, {
        invoice_id: selectedNotification?.metadata?.invoice_id || 0,
      });
    },
    onSuccess: () => {
      toast.success('Subscription approved successfully');
      if (selectedNotification?.id) {
        markAsReadMutate(selectedNotification.id);
      }
      queryClient.invalidateQueries({ queryKey: ['superAdminNotifications'] });
      approveDialog.closeDialog();
      setSelectedNotification(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve subscription');
    },
  });

  const rejectSubscriptionMutation = useMutation({
    mutationFn: (companyId: number) => {
      return invoiceService.rejectSubscription(companyId, {
        invoice_id: selectedNotification?.metadata?.invoice_id || 0,
        rejection_reason: rejectReason || 'Not specified',
      });
    },
    onSuccess: () => {
      toast.success('Subscription rejected successfully');
      if (selectedNotification?.id) {
        markAsReadMutate(selectedNotification.id);
      }
      queryClient.invalidateQueries({ queryKey: ['superAdminNotifications'] });
      rejectDialog.closeDialog();
      setSelectedNotification(null);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject subscription');
    },
  });

  const handleApprove = (notification: SuperAdminNotification) => {
    if (!notification.metadata?.company_id) {
      toast.error('Company ID not found in notification');
      return;
    }
    setSelectedNotification(notification);
    approveDialog.openDialog();
  };

  const handleReject = (notification: SuperAdminNotification) => {
    if (!notification.metadata?.company_id) {
      toast.error('Company ID not found in notification');
      return;
    }
    setSelectedNotification(notification);
    setRejectReason('');
    rejectDialog.openDialog();
  };

  const confirmApprove = () => {
    if (!selectedNotification?.metadata?.company_id) {
      toast.error('Company ID is required');
      return;
    }
    approveSubscriptionMutation.mutate(selectedNotification.metadata.company_id);
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    if (!selectedNotification?.metadata?.company_id) {
      toast.error('Company ID is required');
      return;
    }
    rejectSubscriptionMutation.mutate(selectedNotification.metadata.company_id);
  };

  const handleMarkRead = (id: number) => {
    markAsReadMutate(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_pending':
        return <Clock className="text-warning" size={20} />;
      case 'payment_received':
        return <CheckCircle className="text-success" size={20} />;
      case 'subscription_activated':
        return <CheckCircle className="text-success" size={20} />;
      case 'invoice_overdue':
        return <AlertCircle className="text-danger" size={20} />;
      default:
        return <AlertCircle className="text-primary" size={20} />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'payment_pending':
        return 'bg-warning/10 border-warning/20';
      case 'payment_received':
        return 'bg-success/10 border-success/20';
      case 'subscription_activated':
        return 'bg-success/10 border-success/20';
      case 'invoice_overdue':
        return 'bg-danger/10 border-danger/20';
      default:
        return 'bg-primary/10 border-primary/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'text-danger font-bold';
      case 'normal':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <Breadcrumb pageName="Subscription Notifications" />
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <Breadcrumb pageName="Subscription Notifications" />
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
            <h4 className="text-xl font-semibold text-black dark:text-white">
              Error Loading Notifications
            </h4>
          </div>
          <div className="p-6 text-center">
            <AlertCircle size={48} className="mx-auto mb-3 text-danger opacity-50" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-4">
              Failed to load notifications
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  const notifications = Array.isArray(data?.notifications) ? data.notifications : [];

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Subscription Notifications" />

      <div className="space-y-6">
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="py-6 px-4 md:px-6 xl:px-7.5 border-b border-stroke dark:border-strokedark">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-semibold text-black dark:text-white">
                  Payment Verification Requests
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review and approve/reject pending company subscriptions
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => refetch()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Refresh notifications"
                >
                  <RefreshCw size={20} className="text-primary" />
                </button>
                <div className="px-4 py-2 rounded-full bg-warning/10 text-warning font-bold text-lg">
                  {notifications.filter(n => !n.is_read).length}
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-stroke dark:divide-strokedark">
            {notifications && notifications.length > 0 ? (
              notifications.map((notification: SuperAdminNotification) => {
                const invoiceId = notification.metadata?.invoice_id;
                const companyName = notification.metadata?.company_name || 'Unknown Company';
                const companyId = notification.metadata?.company_id;

                const ActionableType = 'payment_received';
                const isPaymentReceived = notification.notification_type === ActionableType;
                const isFinalAction = ['subscription_activated', 'rejected'].includes(notification.notification_type);

                return (
                  <div
                    key={`notification-${notification.id}`}
                    className={`p-6 transition-all hover:bg-gray-50 dark:hover:bg-meta-4 ${
                      notification.is_read ? 'opacity-60' : isPaymentReceived ? 'bg-success/5' : 'bg-warning/5'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`flex-shrink-0 p-3 rounded-lg border ${getNotificationBadgeColor(
                          notification.notification_type
                        )}`}
                      >
                        {getNotificationIcon(notification.notification_type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="text-base font-semibold text-black dark:text-white">
                              {notification.title}
                            </h5>
                            <p className="text-sm text-primary font-medium mt-0.5">
                              {companyName}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getPriorityColor(
                              notification.priority
                            )}`}
                          >
                            {notification.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {notification.message}
                          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </span>
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {invoiceId && (
                            <Link
                              href={`/invoices?invoice_id=${invoiceId}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              <Eye size={16} />
                              View Invoice
                            </Link>
                          )}
                          <button
                            onClick={() => handleApprove(notification)}
                            disabled={
                              !isPaymentReceived ||
                              isFinalAction ||
                              approveSubscriptionMutation.isPending ||
                              !notification.metadata?.company_id
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 bg-success text-white text-sm rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              !isPaymentReceived
                                ? 'Awaiting payment verification (Status: Pending Payment Verification)'
                                : isFinalAction ? 'Subscription already processed' : 'Approve this subscription'
                            }
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(notification)}
                            disabled={
                              isFinalAction ||
                              rejectSubscriptionMutation.isPending ||
                              approveSubscriptionMutation.isPending ||
                              !notification.metadata?.company_id
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 bg-danger text-white text-sm rounded-lg hover:bg-danger/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              !notification.metadata?.company_id
                                ? 'Company ID not available'
                                : 'Reject this subscription'
                            }
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <CheckCircle size={48} className="mx-auto mb-3 text-success opacity-50" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  All caught up!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  No pending payment verifications at this time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        {...approveDialog.confirmProps}
        type="success"
        title="Approve Subscription"
        message={`Are you sure you want to approve the subscription for "${selectedNotification?.metadata?.company_name}"? This will activate their account and grant full access to the platform.`}
        onConfirm={confirmApprove}
        confirmText="Approve"
        cancelText="Cancel"
        isLoading={approveSubscriptionMutation.isPending}
      />

      <ConfirmDialog
        {...rejectDialog.confirmProps}
        type="danger"
        title="Reject Subscription"
        message={`Are you sure you want to reject the subscription for "${selectedNotification?.metadata?.company_name}"?`}
        onConfirm={confirmReject}
        confirmText="Reject"
        cancelText="Cancel"
        isLoading={rejectSubscriptionMutation.isPending}
      >
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rejection Reason (Required)
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter the reason for rejection..."
            className="w-full px-3 py-2 border border-stroke dark:border-strokedark rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:border-primary"
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </DefaultLayout>
  );
};

export default NotificationsPage;