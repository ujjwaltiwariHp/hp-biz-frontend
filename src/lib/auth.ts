import Cookies from 'js-cookie';

const AUTH_TOKEN_KEY = 'auth-token';

export const setAuthToken = (token: string) => {
  Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7, secure: process.env.NODE_ENV === 'production' });
};

export const getAuthToken = (): string | undefined => {
  if (typeof window !== 'undefined') {

    const cookieToken = Cookies.get(AUTH_TOKEN_KEY);

    return cookieToken;
  }
  return undefined;
};

export const removeAuthToken = () => {
  Cookies.remove(AUTH_TOKEN_KEY);
};
