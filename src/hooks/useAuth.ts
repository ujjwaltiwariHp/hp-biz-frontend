"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { toast } from "react-toastify";
import { LoginCredentials, SuperAdmin, SuperAdminPermissions } from "@/types/auth";

const getTokenFromCookies = (): string | null => {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
    return tokenCookie ? tokenCookie.split('=')[1].trim() : null;
  }
  return null;
};

export function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const currentToken = getTokenFromCookies();
    setToken(currentToken);

    if (!currentToken) {
      setIsInitialized(true);
      if (window.location.pathname !== "/auth/signin") {
        router.push("/auth/signin");
      }
    }
  }, [router]);

  const {
    data: profileResponse,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!!token && !isProfileLoading) {
      setIsInitialized(true);
    }

    if (isProfileError && token) {
        toast.error("Session expired or invalid. Please log in again.");
        authService.logout();
    }
  }, [token, isProfileLoading, isProfileError]);

  const isAuthenticated = !!token && !!profileResponse?.data.id;
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