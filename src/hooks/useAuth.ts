"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { toast } from "react-toastify";
import { LoginCredentials } from "@/types/auth";

const getTokenFromCookies = () => {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }
  return null;
};
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getTokenFromCookies();
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      if (window.location.pathname !== "/auth/signin") {
        router.push("/auth/signin");
      }
    }
  }, [router]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onMutate: () => {
      setIsLoggingIn(true);
    },
    onSuccess: (data) => {
      if (data.success) {
        setIsAuthenticated(true);
        toast.success("Login successful!");
        router.push("/");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
    onSettled: () => {
      setIsLoggingIn(false);
    },
  });

  const login = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    login,
    logout,
    isLoggingIn
  };
}