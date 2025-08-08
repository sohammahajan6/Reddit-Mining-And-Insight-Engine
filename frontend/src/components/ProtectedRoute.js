import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Shield, Lock, UserX } from 'lucide-react';

/**
 * ProtectedRoute component for role-based access control
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requireRole = null, 
  requirePermission = null,
  fallback = null 
}) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const { isDark } = useTheme();

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <AccessDenied 
        icon={Lock}
        title="Authentication Required"
        message="Please sign in to access this feature."
        isDark={isDark}
      />
    );
  }

  // Check role requirement
  if (requireRole && user?.role !== requireRole) {
    const roleNames = {
      admin: 'Administrator',
      moderator: 'Moderator',
      user: 'User'
    };

    return fallback || (
      <AccessDenied 
        icon={Shield}
        title="Insufficient Permissions"
        message={`This feature requires ${roleNames[requireRole]} access.`}
        isDark={isDark}
      />
    );
  }

  // Check permission requirement
  if (requirePermission && !hasPermission(requirePermission)) {
    return fallback || (
      <AccessDenied 
        icon={UserX}
        title="Access Denied"
        message="You don't have permission to access this feature."
        isDark={isDark}
      />
    );
  }

  return children;
};

/**
 * Access Denied component
 */
const AccessDenied = ({ icon: Icon, title, message, isDark }) => {
  return (
    <div className="text-center py-12">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: isDark ? '#2d1b1b' : '#fef2f2' }}
      >
        <Icon className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
        {title}
      </h3>
      <p className="text-sm max-w-md mx-auto" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
        {message}
      </p>
    </div>
  );
};

/**
 * Hook for conditional rendering based on permissions
 */
export const usePermissions = () => {
  const { user, isAuthenticated, hasPermission } = useAuth();

  const canAccess = (permission) => {
    return isAuthenticated && hasPermission(permission);
  };

  const canAccessRole = (role) => {
    return isAuthenticated && user?.role === role;
  };

  const canAccessAnyRole = (roles) => {
    return isAuthenticated && roles.includes(user?.role);
  };

  return {
    canAccess,
    canAccessRole,
    canAccessAnyRole,
    isAuthenticated,
    user
  };
};

/**
 * Higher-order component for protecting components
 */
export const withAuth = (Component, options = {}) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};

/**
 * Component for conditionally rendering content based on permissions
 */
export const PermissionGate = ({ 
  permission, 
  role, 
  roles, 
  requireAuth = true,
  children, 
  fallback = null 
}) => {
  const { user, isAuthenticated, hasPermission } = useAuth();

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  // Check permission
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Check single role
  if (role && user?.role !== role) {
    return fallback;
  }

  // Check multiple roles
  if (roles && !roles.includes(user?.role)) {
    return fallback;
  }

  return children;
};

export default ProtectedRoute;
