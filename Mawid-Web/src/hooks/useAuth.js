import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/authService';
import { formatAuthOrNetworkError } from '../utils/authErrorMessage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const handleAuthError = useCallback((err) => {
    const formattedError = formatAuthOrNetworkError(err);
    setError(formattedError);
    return formattedError;
  }, []);

  useEffect(() => {

    const getInitialSession = async () => {
      try {
        const session = await authService.retrieveSession();
        setUser(session?.user ?? null);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [handleAuthError]);

  // دالة تسجيل الدخول المغلفة بـ useCallback للأداء
  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      return await authService.login(email, password);
    } catch (err) {
      throw handleAuthError(err);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  // دالة تسجيل الخروج
  const logout = useCallback(async () => {
    setError(null);
    try {
      await authService.logout();
    } catch (err) {
      throw handleAuthError(err);
    }
  }, [handleAuthError]);

  // تجميع القيم اللي هنبعتها للموقع كله
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    clearError: () => setError(null),
    isAuthenticated: !!user
  }), [user, loading, error, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be wrapped within an AuthProvider');
  }
  return context;
};