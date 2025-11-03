'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, AlertCircle, Eye } from 'lucide-react';
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

  const [filters] = useState({
    is_read: '0',
    notification_type: 'payment_pending'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['superAdminNotifications', page, limit, filters],
    queryFn: () => notificationService.getAllNotifications(page, limit, filters),
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
    },
  });

  const approveSubscriptionMutation = useMutation({
    mutationFn: (companyId: number) =>
      invoiceService.approveSubscription(companyId, {
        invoice_id: selectedNotification?.metadata?.invoice_id || 0,
      }),
    onSuccess: () => {
      toast.success('Subscription approved successfully');
      markAsReadMutate(selectedNotification?.id || 0);
      queryClient.invalidateQueries({ queryKey: ['superAdminNotifications'] });
      approveDialog.closeDialog();
      setSelectedNotification(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve subscription');
    },
  });

  const rejectSubscriptionMutation = useMutation({
    mutationFn: (companyId: number) =>
      invoiceService.rejectSubscription(companyId, {
        invoice_id: selectedNotification?.metadata?.invoice_id || 0,
        rejection_reason: rejectReason || 'Not specified',
      }),
    onSuccess: () => {
      toast.success('Subscription rejected successfully');
      markAsReadMutate(selectedNotification?.id || 0);
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
    setSelectedNotification(notification);
    approveDialog.openDialog();
  };

  const handleReject = (notification: SuperAdminNotification) => {
    setSelectedNotification(notification);
    setRejectReason('');
    rejectDialog.openDialog();
  };

  const confirmApprove = () => {
    if (selectedNotification?.metadata?.company_id) {
      approveSubscriptionMutation.mutate(selectedNotification.metadata.company_id);
    }
  };

  const confirmReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    if (selectedNotification?.metadata?.company_id) {
      rejectSubscriptionMutation.mutate(selectedNotification.metadata.company_id);
    }
  };

  const handleMarkRead = (id: number) => {
    markAsReadMutate(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_pending':
        return <Clock className="text-warning" size={20} />;
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
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <Breadcrumb pageName="Subscription Notifications" />

      <div className="space-y-6">
        {/* Header Card */}
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
              <div className="px-4 py-2 rounded-full bg-warning/10 text-warning font-bold text-lg">
                {data?.notifications.length || 0}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-stroke dark:divide-strokedark">
            {data?.notifications && data.notifications.length > 0 ? (
              data.notifications.map((notification: SuperAdminNotification) => {
                const invoiceId = notification.metadata?.invoice_id;
                const companyName = notification.metadata?.company_name || 'Unknown Company';
                const companyId = notification.metadata?.company_id;

                return (
                  <div
                    key={notification.id}
                    className={`p-6 transition-all hover:bg-gray-50 dark:hover:bg-meta-4 ${
                      notification.is_read ? 'opacity-60' : 'bg-warning/5'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-3 rounded-lg ${getNotificationBadgeColor(notification.notification_type)}`}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>

                      {/* Content */}
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
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${getPriorityColor(notification.priority)}`}>
                            {notification.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {notification.message}
                        </p>

                        {/* Metadata Display */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
                          {invoiceId && (
                            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
                              <span className="text-gray-500 dark:text-gray-400">Invoice ID</span>
                              <p className="font-medium text-black dark:text-white">{invoiceId}</p>
                            </div>
                          )}
                          <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">Type</span>
                            <p className="font-medium text-black dark:text-white capitalize">
                              {notification.notification_type.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">Created</span>
                            <p className="font-medium text-black dark:text-white">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
                            <span className="text-gray-500 dark:text-gray-400">Time</span>
                            <p className="font-medium text-black dark:text-white">
                              {new Date(notification.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
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
                            disabled={approveSubscriptionMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-success text-white text-sm rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(notification)}
                            disabled={rejectSubscriptionMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-danger text-white text-sm rounded-lg hover:bg-danger/90 transition-colors disabled:opacity-50"
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

      {/* Approve Confirmation Dialog */}
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

      {/* Reject Confirmation Dialog */}
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
        {/* Rejection Reason Input */}
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