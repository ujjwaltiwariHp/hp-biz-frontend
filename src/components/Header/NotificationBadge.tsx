'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { useAuth } from '@/hooks/useAuth';
import { useSSE } from '@/hooks/useSSE';

const NotificationBadge = () => {

    const { isSuperAdmin: isSA } = useAuth();

    const queryKey = ['notifications', 'unreadCount', isSA];

    const queryFn = () => {
        return isSA
            ? notificationService.getSuperAdminUnreadCount()
            : notificationService.getCompanyUnreadCount();
    };

    const { data } = useQuery({
        queryKey,
        queryFn,
        enabled: true,
        select: (data) => {
            const responsePayload = data as any;
            if (isSA) {
                return responsePayload?.stats?.unread_notifications || responsePayload?.unread_count || 0;
            }
            return responsePayload?.unread_count || 0;
        },
        refetchInterval: 300000,
    });

    const unreadCount = data || 0;

    useSSE('new_staff_notification', queryKey);
    useSSE('new_sa_notification', queryKey);

    return (
        <li>
            <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
            >
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 z-10 inline-flex items-center justify-center rounded-full bg-meta-1 p-1 text-xs font-medium text-white ring-2 ring-white dark:ring-boxdark">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                <Bell className="w-5 h-5" />
            </Link>
        </li>
    );
};

export default NotificationBadge;