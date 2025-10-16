import Cookies from 'js-cookie';

/**
 * Retrieves the JWT token from the cookie storage.
 * @returns {string | undefined} The auth token string.
 */
export const getAuthToken = (): string | undefined => {
  if (typeof window === 'undefined') {

    const cookieString = document.cookie;
    const tokenMatch = cookieString.match(/auth-token=([^;]+)/);
    return tokenMatch ? tokenMatch[1] : undefined;
  }


  return Cookies.get('auth-token');
};


export const removeAuthToken = (): void => {

  Cookies.remove('auth-token', { path: '/' });
};
