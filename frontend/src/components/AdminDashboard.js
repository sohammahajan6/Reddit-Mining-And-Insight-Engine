import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  AlertTriangle,
  UserCheck,
  UserX,
  Crown,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

const AdminDashboard = ({ onClose }) => {
  const { isDark } = useTheme();
  const { user, isAdmin, isModerator } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin() || isModerator()) {
      fetchAdminData();
    }
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Import admin service dynamically
      const { getSystemStats, getUsers } = await import('../services/adminService');

      // Fetch real system statistics
      const stats = await getSystemStats();
      setSystemStats(stats);

      // Fetch real users data (first page)
      const usersData = await getUsers({ page: 1, limit: 10 });
      setUsers(usersData.users);

      console.log('✅ Admin data fetched successfully');
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      // Set empty data on error instead of mock data
      setSystemStats({});
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'moderation', label: 'Moderation', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (!isAdmin() && !isModerator()) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <h3 className="text-lg font-semibold mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
          Access Denied
        </h3>
        <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
          You don't have permission to access the admin dashboard.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: isDark ? '#0d1117' : '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-6 border-b"
          style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff' }}
              >
                <Shield className="h-6 w-6" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  Admin Dashboard
                </h2>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  System management and user administration
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: isDark ? '#21262d' : '#f8fafc',
                color: isDark ? '#8b949e' : '#6b7280'
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: isActive 
                      ? (isDark ? '#1e293b' : '#eff6ff')
                      : 'transparent',
                    color: isActive 
                      ? (isDark ? '#60a5fa' : '#3b82f6')
                      : (isDark ? '#8b949e' : '#6b7280')
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>Loading admin data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab systemStats={systemStats} isDark={isDark} />
              )}
              {activeTab === 'users' && (
                <UsersTab users={users} setUsers={setUsers} isDark={isDark} />
              )}
              {activeTab === 'moderation' && (
                <ModerationTab isDark={isDark} />
              )}
              {activeTab === 'settings' && (
                <SettingsTab isDark={isDark} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ systemStats, isDark }) => {
  const statCards = [
    { label: 'Total Users', value: systemStats.totalUsers || 0, icon: Users, color: '#3b82f6' },
    { label: 'Active Users', value: systemStats.activeUsers || 0, icon: UserCheck, color: '#10b981' },
    { label: 'Total Solutions', value: systemStats.totalSolutions || 0, icon: BarChart3, color: '#f59e0b' },
    { label: 'Success Rate', value: `${systemStats.avgSuccessRate || 0}%`, icon: TrendingUp, color: '#8b5cf6' },
    { label: 'Avg Response Time', value: `${systemStats.avgResponseTime || 0}s`, icon: Clock, color: '#ef4444' },
    { label: 'Daily Active', value: systemStats.dailyActiveUsers || 0, icon: Activity, color: '#06b6d4' }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
        System Overview
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div 
        className="p-6 rounded-xl border"
        style={{
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#e5e7eb'
        }}
      >
        <h4 className="text-md font-semibold mb-4" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
          Recent Activity
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>New user registrations today</span>
            <span className="font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              {systemStats.recentActivity?.newRegistrationsToday || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>Solutions generated today</span>
            <span className="font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              {systemStats.recentActivity?.solutionsToday || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>User feedback today</span>
            <span className="font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              {systemStats.recentActivity?.feedbackToday || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>Error events today</span>
            <span className="font-semibold" style={{
              color: (systemStats.recentActivity?.errorEventsToday || 0) > 0 ? '#ef4444' : (isDark ? '#f0f6fc' : '#111827')
            }}>
              {systemStats.recentActivity?.errorEventsToday || 0}
            </span>
          </div>
        </div>
      </div>

      {/* System Health Section */}
      <div
        className="p-4 rounded-xl border"
        style={{
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#e5e7eb'
        }}
      >
        <h4 className="text-md font-semibold mb-4" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
          System Health
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>System Status</span>
            <span className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                systemStats.systemHealth?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="font-semibold capitalize" style={{
                color: systemStats.systemHealth?.status === 'healthy' ? '#10b981' : '#ef4444'
              }}>
                {systemStats.systemHealth?.status || 'Unknown'}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>System Uptime</span>
            <span className="font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              {systemStats.systemUptime || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>Error Rate</span>
            <span className="font-semibold" style={{
              color: (systemStats.systemHealth?.errorRate || 0) > 5 ? '#ef4444' : '#10b981'
            }}>
              {systemStats.systemHealth?.errorRate || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>Avg Response Time</span>
            <span className="font-semibold" style={{
              color: (systemStats.avgResponseTime || 0) > 3 ? '#ef4444' : '#10b981'
            }}>
              {systemStats.avgResponseTime || 0}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, setUsers, isDark }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUserAction = async (userId, action) => {
    try {
      const { toggleUserStatus, updateUserRole } = await import('../services/adminService');

      switch (action) {
        case 'activate':
        case 'deactivate':
          const isActive = action === 'activate';
          await toggleUserStatus(userId, isActive);
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId ? { ...user, isActive } : user
            )
          );
          break;

        case 'promote':
          const currentUser = users.find(u => u.id === userId);
          const newRole = currentUser.role === 'user' ? 'moderator' : 'admin';
          await updateUserRole(userId, newRole);
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId ? { ...user, role: newRole } : user
            )
          );
          break;

        case 'demote':
          const userToDemote = users.find(u => u.id === userId);
          const demotedRole = userToDemote.role === 'admin' ? 'moderator' : 'user';
          await updateUserRole(userId, demotedRole);
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId ? { ...user, role: demotedRole } : user
            )
          );
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error performing user action:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
          User Management
        </h3>
        <button
          className="px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
        >
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                 style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border"
            style={{
              backgroundColor: isDark ? '#21262d' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#d1d5db',
              color: isDark ? '#f0f6fc' : '#111827'
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: isDark ? '#21262d' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#d1d5db',
            color: isDark ? '#f0f6fc' : '#111827'
          }}
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="moderator">Moderators</option>
          <option value="admin">Admins</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: isDark ? '#21262d' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#d1d5db',
            color: isDark ? '#f0f6fc' : '#111827'
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}
      >
        <div
          className="px-6 py-3 border-b"
          style={{
            backgroundColor: isDark ? '#161b22' : '#f9fafb',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}
        >
          <div className="grid grid-cols-6 gap-4 text-sm font-medium" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            <span>User</span>
            <span>Role</span>
            <span>Status</span>
            <span>Solutions</span>
            <span>Success Rate</span>
            <span>Actions</span>
          </div>
        </div>

        <div style={{ backgroundColor: isDark ? '#0d1117' : '#ffffff' }}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="px-6 py-4 border-b last:border-b-0"
              style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}
            >
              <div className="grid grid-cols-6 gap-4 items-center">
                <div>
                  <div className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                    {user.username}
                  </div>
                  <div className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                    {user.email}
                  </div>
                </div>

                <div>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: user.role === 'admin'
                        ? '#dc2626'
                        : user.role === 'moderator'
                        ? '#f59e0b'
                        : '#10b981',
                      color: '#ffffff'
                    }}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {user.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {user.stats.totalSolutions}
                </div>

                <div style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {user.stats.successRate}%
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate')}
                    className="p-1 rounded transition-colors"
                    style={{ color: user.isActive ? '#ef4444' : '#10b981' }}
                    title={user.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => handleUserAction(user.id, 'promote')}
                    className="p-1 rounded transition-colors"
                    style={{ color: '#3b82f6' }}
                    title="Promote"
                  >
                    <Crown className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleUserAction(user.id, 'edit')}
                    className="p-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    style={{ color: '#8b949e' }}
                    title="Edit user"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Moderation Tab Component
const ModerationTab = ({ isDark }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
        Content Moderation
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              12
            </span>
          </div>
          <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Pending Reports
          </p>
        </div>

        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              45
            </span>
          </div>
          <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Actions Taken
          </p>
        </div>

        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              98.5%
            </span>
          </div>
          <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Resolution Rate
          </p>
        </div>
      </div>

      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto mb-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
        <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
          No pending moderation actions at this time.
        </p>
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ isDark }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
        System Settings
      </h3>

      <div className="space-y-4">
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}
        >
          <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            API Rate Limiting
          </h4>
          <p className="text-sm mb-3" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Configure rate limits for API endpoints
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                Requests per minute
              </label>
              <input
                type="number"
                defaultValue="60"
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: isDark ? '#21262d' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#d1d5db',
                  color: isDark ? '#f0f6fc' : '#111827'
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                Burst limit
              </label>
              <input
                type="number"
                defaultValue="100"
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: isDark ? '#21262d' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#d1d5db',
                  color: isDark ? '#f0f6fc' : '#111827'
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}
        >
          <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Content Moderation
          </h4>
          <p className="text-sm mb-3" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Configure automatic content filtering
          </p>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span style={{ color: isDark ? '#f0f6fc' : '#111827' }}>Enable automatic spam detection</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span style={{ color: isDark ? '#f0f6fc' : '#111827' }}>Filter inappropriate content</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span style={{ color: isDark ? '#f0f6fc' : '#111827' }}>Require manual approval for new users</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="px-6 py-2 rounded-lg font-medium"
            style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
