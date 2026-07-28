// hooks/useAuth.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { decodeToken } from '../utils/auth';

/**
 * Hook to validate and retrieve user authentication
 */
export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    validateAuth();
  }, []);

  const validateAuth = () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verify token is valid
      const decoded = decodeToken(token);
      
      if (!decoded) {
        // Token is invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        // Token expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('Auth validation error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/admin/login');
  };

  const getToken = () => localStorage.getItem('token');

  const getAuthHeader = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    getToken,
    getAuthHeader,
    validateAuth,
  };
};

/**
 * HOC to protect admin pages
 */
export const withAdminAuth = (Component) => {
  return function AdminComponent(props) {
    const router = useRouter();
    const { user, loading, isAuthenticated } = useAuth();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/admin/login');
      }
    }, [loading, isAuthenticated, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} user={user} />;
  };
};
