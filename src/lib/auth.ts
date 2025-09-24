export interface LoginCredentials {
  email: string;
  password: string;
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));

  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }

  return null;
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};