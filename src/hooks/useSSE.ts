import { useEffect, useCallback } from "react";
import { useQueryClient, QueryKey } from "@tanstack/react-query";
import { useSSEContext } from "@/context/SSEContext";

type SSEEventType =
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

export const useSSE = (
  eventType: SSEEventType,
  queryKey: QueryKey,
  options: SSEInvalidationOptions = {}
) => {
  const { subscribe } = useSSEContext();
  const queryClient = useQueryClient();
  const { refetchQueries = false } = options;

  const handleEvent = useCallback((data: any) => {
    queryClient.invalidateQueries({ queryKey });

    if (refetchQueries) {
      queryClient.refetchQueries({ queryKey });
    }
  }, [queryClient, queryKey, refetchQueries]);

  useEffect(() => {
    const unsubscribe = subscribe(eventType, handleEvent);

    return () => {
      unsubscribe();
    };
  }, [subscribe, eventType, handleEvent]);
};