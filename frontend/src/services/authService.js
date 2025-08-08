import { apiRequest, handleApiError } from './api';
import toast from 'react-hot-toast';

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} rememberMe - Remember user login
 * @param {string} role - User role (user/admin)
 * @param {string} adminKey - Admin key (required for admin login)
 * @returns {Promise<Object>} Login response
 */
export const login = async (email, password, rememberMe = false, role = 'user', adminKey = '') => {
  try {
    console.log('🔍 Login function received:', { email, password: '***', rememberMe, role, adminKey: adminKey ? '***' : 'empty' });
    toast.loading('Signing in...', { id: 'auth-login' });
    
    const loginData = {
      email,
      password,
      role
    };

    // Add admin key if role is admin
    if (role === 'admin') {
      loginData.adminKey = adminKey;
    }

    console.log('🔍 Final login data being sent:', loginData);
    const response = await apiRequest.post('/auth/login', loginData);
    
    toast.success('Welcome back!', { id: 'auth-login' });
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Login failed');
    toast.error(message, { id: 'auth-login' });
    throw new Error(message);
  }
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration response
 */
export const register = async (userData) => {
  try {
    toast.loading('Creating your account...', { id: 'auth-register' });
    
    const response = await apiRequest.post('/auth/register', userData);
    
    toast.success('Account created successfully!', { id: 'auth-register' });
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Registration failed');
    toast.error(message, { id: 'auth-register' });
    throw new Error(message);
  }
};

/**
 * Logout user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    await apiRequest.post('/auth/logout');
    toast.success('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    // Don't show error for logout failures
  }
};

/**
 * Get current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiRequest.get('/auth/me');
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to get user profile');
    throw new Error(message);
  }
};

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated user data
 */
export const updateProfile = async (updates) => {
  try {
    toast.loading('Updating profile...', { id: 'update-profile' });
    
    const response = await apiRequest.put('/auth/profile', updates);
    
    toast.success('Profile updated successfully!', { id: 'update-profile' });
    return response.data.data.user;
  } catch (error) {
    const message = handleApiError(error, 'Failed to update profile');
    toast.error(message, { id: 'update-profile' });
    throw new Error(message);
  }
};

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    toast.loading('Changing password...', { id: 'change-password' });
    
    await apiRequest.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    toast.success('Password changed successfully!', { id: 'change-password' });
  } catch (error) {
    const message = handleApiError(error, 'Failed to change password');
    toast.error(message, { id: 'change-password' });
    throw new Error(message);
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} New token data
 */
export const refreshToken = async (refreshToken) => {
  try {
    const response = await apiRequest.post('/auth/refresh', {
      refreshToken
    });
    
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Token refresh failed');
    throw new Error(message);
  }
};

/**
 * Verify token validity
 * @returns {Promise<Object>} Token verification data
 */
export const verifyToken = async () => {
  try {
    const response = await apiRequest.get('/auth/verify-token');
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Token verification failed');
    throw new Error(message);
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const forgotPassword = async (email) => {
  try {
    toast.loading('Sending reset email...', { id: 'forgot-password' });
    
    await apiRequest.post('/auth/forgot-password', { email });
    
    toast.success('Password reset email sent!', { id: 'forgot-password' });
  } catch (error) {
    const message = handleApiError(error, 'Failed to send reset email');
    toast.error(message, { id: 'forgot-password' });
    throw new Error(message);
  }
};

/**
 * Update user preferences
 * @param {Object} preferences - User preferences
 * @returns {Promise<Object>} Updated preferences
 */
export const updatePreferences = async (preferences) => {
  try {
    toast.loading('Updating preferences...', { id: 'update-preferences' });
    
    const response = await apiRequest.put('/auth/preferences', preferences);
    
    toast.success('Preferences updated!', { id: 'update-preferences' });
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to update preferences');
    toast.error(message, { id: 'update-preferences' });
    throw new Error(message);
  }
};

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
export const getUserStats = async () => {
  try {
    const response = await apiRequest.get('/users/stats');
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to get user statistics');
    throw new Error(message);
  }
};

/**
 * Upload user avatar
 * @param {File} file - Avatar image file
 * @returns {Promise<string>} Avatar URL
 */
export const uploadAvatar = async (file) => {
  try {
    toast.loading('Uploading avatar...', { id: 'upload-avatar' });
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiRequest.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    toast.success('Avatar updated!', { id: 'upload-avatar' });
    return response.data.data.avatarUrl;
  } catch (error) {
    const message = handleApiError(error, 'Failed to upload avatar');
    toast.error(message, { id: 'upload-avatar' });
    throw new Error(message);
  }
};

/**
 * Delete user account
 * @param {string} password - User password for confirmation
 * @returns {Promise<void>}
 */
export const deleteAccount = async (password) => {
  try {
    toast.loading('Deleting account...', { id: 'delete-account' });
    
    await apiRequest.delete('/auth/account', {
      data: { password }
    });
    
    toast.success('Account deleted successfully', { id: 'delete-account' });
  } catch (error) {
    const message = handleApiError(error, 'Failed to delete account');
    toast.error(message, { id: 'delete-account' });
    throw new Error(message);
  }
};

/**
 * Get user bookmarks
 * @returns {Promise<Array>} User bookmarks
 */
export const getBookmarks = async () => {
  try {
    const response = await apiRequest.get('/auth/bookmarks');
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to get bookmarks');
    throw new Error(message);
  }
};

/**
 * Add bookmark
 * @param {Object} bookmark - Bookmark data
 * @returns {Promise<Object>} Created bookmark
 */
export const addBookmark = async (bookmark) => {
  try {
    const response = await apiRequest.post('/auth/bookmarks', bookmark);
    toast.success('Bookmark added!');
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to add bookmark');
    toast.error(message);
    throw new Error(message);
  }
};

/**
 * Remove bookmark
 * @param {string} bookmarkId - Bookmark ID
 * @returns {Promise<void>}
 */
export const removeBookmark = async (bookmarkId) => {
  try {
    await apiRequest.delete(`/auth/bookmarks/${bookmarkId}`);
    toast.success('Bookmark removed!');
  } catch (error) {
    const message = handleApiError(error, 'Failed to remove bookmark');
    toast.error(message);
    throw new Error(message);
  }
};

/**
 * Check if user has permission
 * @param {string} permission - Permission to check
 * @param {Object} user - User object
 * @returns {boolean} Has permission
 */
export const hasPermission = (permission, user) => {
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

export const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  refreshToken,
  verifyToken,
  forgotPassword,
  updatePreferences,
  getUserStats,
  uploadAvatar,
  deleteAccount,
  getBookmarks,
  addBookmark,
  removeBookmark,
  hasPermission
};

export default authService;
