'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/api';
import { setToken, getToken, removeToken, isLoggedIn } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const data = await auth.getMe();
      setUser(data.user);
    } catch {
      removeToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (isLoggedIn()) {
        await fetchUser();
      }
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  const login = async (email, password) => {
    const data = await auth.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (email, password, name) => {
    const data = await auth.register(email, password, name);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    removeToken();
    setUser(null);
    router.push('/');
  };

  const deleteAccount = async () => {
    await auth.deleteAccount();
    removeToken();
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
