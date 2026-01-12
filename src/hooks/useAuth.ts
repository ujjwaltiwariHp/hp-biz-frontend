"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { toast } from "react-toastify";
import { LoginCredentials, SuperAdmin, SuperAdminPermissions } from "@/types/auth";
import { getAuthToken } from "@/lib/auth";

export function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(() => getAuthToken() || null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only set initialized if we don't have a token (logged out)
    // If we have a token, we wait for profile (or initial data)
    const currentToken = getAuthToken();
    if (!currentToken) {
      setIsInitialized(true);
    }
  }, []);

  const {
    data: profileResponse,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    initialData: () => {
      const user = authService.getCurrentUser();
      if (user) {
        return {
          success: true,
          message: 'Loaded from storage',
          data: user,
          meta: { timezone: 'UTC', timezone_abbr: 'UTC' }
        } as any; // Cast to satisfy strict typing if needed, mostly matches
      }
      return undefined;
    }
  });

  useEffect(() => {
    // If we have profile data (even from cache), we are initialized
    if (profileResponse?.data) {
      setIsInitialized(true);
    }

    if (!!token && !isProfileLoading && !profileResponse) {
      // Loaded but no profile?
      setIsInitialized(true);
    }

    if (isProfileError && token) {
      toast.error("Session expired or invalid. Please log in again.");
      authService.logout();
    }
  }, [token, isProfileLoading, isProfileError, profileResponse]);

  const isAuthenticated = !!token && !!profileResponse?.data?.id;
  const profile: SuperAdmin | undefined = profileResponse?.data;
  const permissions: SuperAdminPermissions = profile?.permissions || {};

  const isSuperAdmin = profile?.role_name === 'Super Admin';
  const isSubAdmin = profile?.role_name === 'Sub Admin';

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      if (data.success && data.data.token) {
        setToken(data.data.token);
        toast.success("Login successful!");
        router.push("/");
      } else {
        toast.error("Login failed.");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  const login = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials);
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    router.push("/auth/signin");
  };

  return {
    isAuthenticated,
    isInitialized,
    profile,
    permissions,
    isSuperAdmin,
    isSubAdmin,
    login,
    logout,
    isLoggingIn: loginMutation.isPending
  };
}