'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';

const NotificationBadge = () => {
    const { data: notificationStats, isLoading } = useQuery({
        queryKey: ['superAdminNotificationsStats'],
        queryFn: notificationService.getUnreadCount,
        refetchInterval: 60000,
    });

    const unreadCount = notificationStats?.unread_count || 0;

    return (
        <li>
            <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
            >
                {/* Display Badge if there are unread notifications */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 z-10 inline-flex items-center justify-center rounded-full bg-meta-1 p-1 text-xs font-medium text-white ring-2 ring-white dark:ring-boxdark">
                        {unreadCount}
                    </span>
                )}
                <Bell className="w-5 h-5" />
            </Link>
        </li>
    );
};

export default NotificationBadge;