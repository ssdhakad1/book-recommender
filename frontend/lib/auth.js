import Cookies from 'js-cookie';

const TOKEN_KEY = 'token';

export function setToken(token) {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'lax' });
}

export function getToken() {
  return Cookies.get(TOKEN_KEY) || null;
}

export function removeToken() {
  Cookies.remove(TOKEN_KEY);
}

export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;

  try {
    // Decode JWT payload (base64) to check expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      removeToken();
      return false;
    }
    return true;
  } catch {
    return !!token;
  }
}
