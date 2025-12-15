'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import { useAuth } from '@/hooks/useAuth';
import { useSSE } from '@/hooks/useSSE';

const NotificationBadge = () => {
    const pathname = usePathname();
    const { isSuperAdmin: isSA } = useAuth();

    // State to control blinking animation
    const [isBlinking, setIsBlinking] = useState(false);
    // Ref to track previous count to detect *new* notifications
    const prevUnreadCount = useRef(0);

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

    // Listen for SSE events to refresh count
    useSSE('new_staff_notification', queryKey);
    useSSE('new_sa_notification', queryKey);

    // Logic: If unread count increases AND we are not on the notifications page, start blinking.
    useEffect(() => {
        if (unreadCount > prevUnreadCount.current) {
            if (pathname !== '/notifications') {
                setIsBlinking(true);
            }
        }
        prevUnreadCount.current = unreadCount;
    }, [unreadCount, pathname]);

    // Logic: Stop blinking immediately when user visits the notifications page
    useEffect(() => {
        if (pathname === '/notifications') {
            setIsBlinking(false);
        }
    }, [pathname]);

    return (
        <li>
            <Link
                href="/notifications"
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white ${
                    isBlinking ? 'text-primary ring-2 ring-primary/20 animate-pulse' : ''
                }`}
            >
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 z-10 inline-flex items-center justify-center rounded-full bg-meta-1 p-1 text-xs font-medium text-white ring-2 ring-white dark:ring-boxdark">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
                <Bell className={`w-5 h-5 ${isBlinking ? 'animate-pulse' : ''}`} />
            </Link>
        </li>
    );
};

export default NotificationBadge;