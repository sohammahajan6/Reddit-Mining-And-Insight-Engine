import { apiRequest, handleApiError } from './api';
import toast from 'react-hot-toast';

/**
 * Get system statistics for admin dashboard
 * @returns {Promise<Object>} System statistics
 */
export const getSystemStats = async () => {
  try {
    const response = await apiRequest.get('/admin/stats');
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to fetch system statistics');
    throw new Error(message);
  }
};

/**
 * Get all users for admin management
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Users data with pagination
 */
export const getUsers = async (params = {}) => {
  try {
    const response = await apiRequest.get('/admin/users', { params });
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to fetch users');
    throw new Error(message);
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
export const getDatabaseStats = async () => {
  try {
    const response = await apiRequest.get('/admin/database/stats');
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to fetch database statistics');
    throw new Error(message);
  }
};

/**
 * Update user role
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} Updated user
 */
export const updateUserRole = async (userId, role) => {
  try {
    toast.loading('Updating user role...', { id: 'update-role' });
    
    const response = await apiRequest.put(`/admin/users/${userId}/role`, { role });
    
    toast.success('User role updated successfully', { id: 'update-role' });
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to update user role');
    toast.error(message, { id: 'update-role' });
    throw new Error(message);
  }
};

/**
 * Toggle user active status
 * @param {string} userId - User ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>} Updated user
 */
export const toggleUserStatus = async (userId, isActive) => {
  try {
    toast.loading(`${isActive ? 'Activating' : 'Deactivating'} user...`, { id: 'toggle-status' });
    
    const response = await apiRequest.put(`/admin/users/${userId}/status`, { isActive });
    
    toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully`, { id: 'toggle-status' });
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to update user status');
    toast.error(message, { id: 'toggle-status' });
    throw new Error(message);
  }
};

/**
 * Delete user (soft delete)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  try {
    toast.loading('Deleting user...', { id: 'delete-user' });
    
    await apiRequest.delete(`/admin/users/${userId}`);
    
    toast.success('User deleted successfully', { id: 'delete-user' });
  } catch (error) {
    const message = handleApiError(error, 'Failed to delete user');
    toast.error(message, { id: 'delete-user' });
    throw new Error(message);
  }
};

/**
 * Get system settings
 * @returns {Promise<Object>} System settings
 */
export const getSystemSettings = async () => {
  try {
    const response = await apiRequest.get('/admin/settings');
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to fetch system settings');
    throw new Error(message);
  }
};

/**
 * Update system settings
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
export const updateSystemSettings = async (settings) => {
  try {
    toast.loading('Updating system settings...', { id: 'update-settings' });
    
    const response = await apiRequest.put('/admin/settings', settings);
    
    toast.success('System settings updated successfully', { id: 'update-settings' });
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to update system settings');
    toast.error(message, { id: 'update-settings' });
    throw new Error(message);
  }
};

/**
 * Get system health status
 * @returns {Promise<Object>} System health
 */
export const getSystemHealth = async () => {
  try {
    const response = await apiRequest.get('/health');
    return response.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to fetch system health');
    throw new Error(message);
  }
};

export const adminService = {
  getSystemStats,
  getUsers,
  getDatabaseStats,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getSystemSettings,
  updateSystemSettings,
  getSystemHealth
};

export default adminService;
