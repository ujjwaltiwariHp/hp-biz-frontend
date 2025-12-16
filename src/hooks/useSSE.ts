import { useEffect, useCallback, useMemo } from "react";
import { useQueryClient, QueryKey } from "@tanstack/react-query";
import { useSSEContext } from "@/context/SSEContext";
import { authService } from "@/services/auth.service";

export type SSEEventType =
  'new_staff_notification' |
  'leads_list_refresh' |
  'staff_list_refresh' |
  'new_sa_notification' |
  'sa_company_list_refresh' |
  'sa_subscription_status_update' |
  'sa_finance_update' |
  'new_activity_log' |
  'new_system_log' |
  'sa_new_activity_log' |
  'sa_new_system_log';

interface SSEInvalidationOptions {
  refetchQueries?: boolean;
}

type SSEHandlerOrKey = QueryKey | ((data?: any) => void);

export const useSSE = (
  eventType: SSEEventType,
  handlerOrKey: SSEHandlerOrKey,
  options: SSEInvalidationOptions = {}
) => {
  const { subscribe } = useSSEContext();
  const queryClient = useQueryClient();
  const { refetchQueries = false } = options;

  const effectiveEventType = useMemo(() => {
    const currentUser = authService.getCurrentUser();

    const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.is_super_admin || (!!currentUser && !!currentUser.id && !currentUser.company_id);

    if (isSuperAdmin) {
      if (eventType === 'new_activity_log') return 'sa_new_activity_log';
      if (eventType === 'new_system_log') return 'sa_new_system_log';
    }

    return eventType;
  }, [eventType]);

  const handleEvent = useCallback((data: any) => {
    if (typeof handlerOrKey === 'function') {
      handlerOrKey(data);
    } else if (Array.isArray(handlerOrKey)) {
      queryClient.invalidateQueries({ queryKey: handlerOrKey });

      if (refetchQueries) {
        queryClient.refetchQueries({ queryKey: handlerOrKey });
      }
    }
  }, [queryClient, handlerOrKey, refetchQueries]);

  useEffect(() => {
    const unsubscribe = subscribe(effectiveEventType, handleEvent);

    return () => {
      unsubscribe();
    };
  }, [subscribe, effectiveEventType, handleEvent]);
};