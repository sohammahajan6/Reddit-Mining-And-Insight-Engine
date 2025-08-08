import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';

      if (token) {
        // Only auto-login if user chose "Remember Me"
        if (rememberMe) {
          const userData = await authService.verifyToken();
          setUser(userData.user);
          setIsAuthenticated(true);
          console.log('✅ Auto-login successful (Remember Me enabled)');
        } else {
          // Clear tokens if user didn't choose remember me
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('rememberMe');
          console.log('🔒 Auto-login skipped (Remember Me not enabled)');
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, rememberMe = false, role = 'user', adminKey = '') => {
    try {
      const response = await authService.login(email, password, rememberMe, role, adminKey);
      const { user: userData, token, refreshToken } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('rememberMe', rememberMe.toString());

      setUser(userData);
      setIsAuthenticated(true);

      console.log(`✅ Login successful (Remember Me: ${rememberMe})`);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { user: newUser, token, refreshToken } = response;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      setUser(null);
      setIsAuthenticated(false);
      console.log('🔒 Logout successful');
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshTokenValue);
      localStorage.setItem('token', response.token);

      return response.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      const userData = response.user;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    const rolePermissions = {
      user: [
        'read:own_profile',
        'update:own_profile',
        'create:solutions',
        'read:analytics',
        'export:own_data'
      ],

      admin: [
        'read:own_profile',
        'update:own_profile',
        'create:solutions',
        'read:analytics',
        'export:own_data',
        'moderate:content',
        'read:user_reports',
        'update:user_status',
        'read:all_users',
        'update:all_users',
        'delete:users',
        'read:system_analytics',
        'update:system_settings',
        'manage:roles'
      ]
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };



  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    refreshUser,
    hasPermission,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
