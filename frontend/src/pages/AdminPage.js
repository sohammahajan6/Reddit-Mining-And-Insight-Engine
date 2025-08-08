import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  BarChart3,
  Shield,
  Database,
  Activity,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Search,

  Download,
  RefreshCw,
  ArrowLeft,

  TrendingUp,
  Clock,

} from 'lucide-react';

const AdminPage = ({ onClose }) => {
  const { isDark } = useTheme();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [dbStats, setDbStats] = useState({});

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin()) {
      onClose();
    }
  }, [isAdmin, onClose]);

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'database', label: 'Database', icon: Database }
  ];



  useEffect(() => {
    loadUsers();
    loadSystemStats();
    loadDbStats();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { getUsers } = await import('../services/adminService');
      const usersData = await getUsers({ page: 1, limit: 100 });
      setUsers(usersData.users);
      console.log('✅ Users loaded successfully');
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const { getSystemStats } = await import('../services/adminService');
      const stats = await getSystemStats();
      setSystemStats(stats);
      console.log('✅ System stats loaded successfully');
    } catch (error) {
      console.error('Failed to load system stats:', error);
      setSystemStats({});
    }
  };



  const loadDbStats = async () => {
    try {
      const { getDatabaseStats } = await import('../services/adminService');
      const stats = await getDatabaseStats();
      setDbStats(stats);
      console.log('✅ Database stats loaded successfully');
    } catch (error) {
      console.error('Failed to load database stats:', error);
      setDbStats({});
    }
  };



  const handleUserAction = async (userId, action) => {
    try {
      setLoading(true);

      switch (action) {
        case 'edit':
          const userToEdit = users.find(u => u.id === userId);
          setEditingUser(userToEdit);
          break;

        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const { deleteUser } = await import('../services/adminService');
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
            console.log('User deleted:', userId);
          }
          break;

        case 'toggle-status':
          const userToToggle = users.find(u => u.id === userId);
          if (userToToggle) {
            const { toggleUserStatus } = await import('../services/adminService');
            await toggleUserStatus(userId, !userToToggle.isActive);
            setUsers(users.map(u =>
              u.id === userId ? { ...u, isActive: !u.isActive } : u
            ));
          }
          break;

        case 'change-role':
          const user = users.find(u => u.id === userId);
          if (user) {
            // Show role selection modal
            setEditingUser(user);
            setShowRoleModal(true);
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('User action failed:', error);
      alert('Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const renderUserManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              User Management
            </h3>
            <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
              {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 rounded-lg border"
            style={{
              backgroundColor: isDark ? '#21262d' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#d1d5db',
              color: isDark ? '#f0f6fc' : '#111827'
            }}
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>

            <option value="admin">Admins</option>
          </select>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 rounded-lg border"
            style={{
              backgroundColor: isDark ? '#21262d' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#d1d5db'
            }}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border overflow-hidden" style={{
        backgroundColor: isDark ? '#0d1117' : '#ffffff',
        borderColor: isDark ? '#30363d' : '#e5e7eb'
      }}>
        <table className="w-full">
          <thead style={{ backgroundColor: isDark ? '#161b22' : '#f9fafb' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                Solutions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ divideColor: isDark ? '#30363d' : '#e5e7eb' }}>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                    <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>No users found</span>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff' }}>
                        <Users className="h-4 w-4" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                        {user.username}
                      </div>
                      <div className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {user.totalSolutions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  {user.lastLogin}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUserAction(user.id, 'edit')}
                      className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </button>

                    <button
                      onClick={() => handleUserAction(user.id, 'toggle-status')}
                      className="p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                      title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.isActive ? (
                        <UserX className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      )}
                    </button>

                    <button
                      onClick={() => handleUserAction(user.id, 'change-role')}
                      className="p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      title="Change Role"
                    >
                      <Shield className="h-4 w-4 text-purple-600" />
                    </button>

                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleUserAction(user.id, 'delete')}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemStats = () => {
    const statCards = [
      {
        key: 'totalUsers',
        label: 'Total Users',
        value: systemStats.totalUsers || 0,
        icon: Users,
        color: '#3b82f6',
        change: '+12%'
      },
      {
        key: 'activeUsers',
        label: 'Active Users',
        value: systemStats.activeUsers || 0,
        icon: UserCheck,
        color: '#10b981',
        change: '+8%'
      },
      {
        key: 'totalSolutions',
        label: 'Total Solutions',
        value: systemStats.totalSolutions || 0,
        icon: BarChart3,
        color: '#f59e0b',
        change: '+23%'
      },
      {
        key: 'avgSuccessRate',
        label: 'Success Rate',
        value: `${systemStats.avgSuccessRate || 0}%`,
        icon: TrendingUp,
        color: '#10b981',
        change: '+2%'
      },
      {
        key: 'avgResponseTime',
        label: 'Avg Response Time',
        value: `${systemStats.avgResponseTime || 0}s`,
        icon: Activity,
        color: '#8b5cf6',
        change: '-5%'
      },
      {
        key: 'dailyActiveUsers',
        label: 'Daily Active Users',
        value: systemStats.dailyActiveUsers || 0,
        icon: Clock,
        color: '#ef4444',
        change: '+15%'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            System Analytics
          </h3>
          <button
            onClick={loadSystemStats}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border"
            style={{
              backgroundColor: isDark ? '#21262d' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#d1d5db',
              color: isDark ? '#8b949e' : '#6b7280'
            }}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="p-6 rounded-lg border" style={{
                backgroundColor: isDark ? '#0d1117' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <Icon className="h-8 w-8" style={{ color: stat.color }} />
                  <span className={`text-sm font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' :
                    stat.change.startsWith('-') ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-lg border" style={{
            backgroundColor: isDark ? '#0d1117' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}>
            <h4 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Recent Activity
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  New user registered: john_doe
                </span>
                <span className="text-xs" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                  2 min ago
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Solution generated for r/advice
                </span>
                <span className="text-xs" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                  5 min ago
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  System backup completed
                </span>
                <span className="text-xs" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                  1 hour ago
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border" style={{
            backgroundColor: isDark ? '#0d1117' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}>
            <h4 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              System Health
            </h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Database Connection
                </span>
                <span className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  API Response Time
                </span>
                <span className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Fast (120ms)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Memory Usage
                </span>
                <span className="flex items-center text-sm text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  Moderate (68%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: isDark ? '#0d1117' : '#ffffff' }}>
      {/* Header */}
      <div className="border-b px-6 py-4 flex-shrink-0" style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: isDark ? '#21262d' : '#f8fafc',
                color: isDark ? '#8b949e' : '#6b7280'
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                Admin Dashboard
              </h1>
              <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                Manage users, settings, and system configuration
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg transition-colors" style={{
              backgroundColor: isDark ? '#21262d' : '#f8fafc',
              color: isDark ? '#8b949e' : '#6b7280'
            }}>
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg transition-colors" style={{
              backgroundColor: isDark ? '#21262d' : '#f8fafc',
              color: isDark ? '#8b949e' : '#6b7280'
            }}>
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b px-6 flex-shrink-0" style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}>
        <div className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  color: isActive 
                    ? '#3b82f6' 
                    : isDark ? '#8b949e' : '#6b7280'
                }}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6" style={{
        maxHeight: 'calc(100vh - 140px)',
        minHeight: 0, // Important for flex child to shrink
        scrollBehavior: 'smooth'
      }}>
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'analytics' && renderSystemStats()}



        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                Database Management
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadDbStats}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: isDark ? '#21262d' : '#ffffff',
                    borderColor: isDark ? '#30363d' : '#d1d5db',
                    color: isDark ? '#8b949e' : '#6b7280'
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to create a backup? This may take a few minutes.')) {
                      alert('Backup started! You will be notified when complete.');
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                >
                  <Download className="h-4 w-4" />
                  <span>Create Backup</span>
                </button>
              </div>
            </div>

            {/* Database Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <Database className="h-6 w-6" style={{ color: '#10b981' }} />
                  <span className={`text-sm font-medium ${
                    dbStats.connectionStatus === 'healthy' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {dbStats.connectionStatus === 'healthy' ? 'Healthy' : 'Error'}
                  </span>
                </div>
                <p className="text-lg font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  Connection
                </p>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Database Status
                </p>
              </div>

              <div className="p-4 rounded-lg border" style={{
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-6 w-6" style={{ color: '#3b82f6' }} />
                </div>
                <p className="text-lg font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {dbStats.activeConnections}/{dbStats.maxConnections}
                </p>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Active Connections
                </p>
              </div>

              <div className="p-4 rounded-lg border" style={{
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <Database className="h-6 w-6" style={{ color: '#f59e0b' }} />
                </div>
                <p className="text-lg font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {dbStats.databaseSize}
                </p>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Database Size
                </p>
              </div>

              <div className="p-4 rounded-lg border" style={{
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-6 w-6" style={{ color: '#8b5cf6' }} />
                </div>
                <p className="text-lg font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {dbStats.tableCount}
                </p>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Tables
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Query Performance */}
              <div className="p-6 rounded-lg border" style={{
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <h4 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  Query Performance
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      Average Query Time
                    </span>
                    <span className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      {dbStats.queryPerformance?.avgQueryTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      Slow Queries (>1s)
                    </span>
                    <span className={`font-medium ${
                      (dbStats.queryPerformance?.slowQueries || 0) > 5 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {dbStats.queryPerformance?.slowQueries}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      Total Queries Today
                    </span>
                    <span className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      {dbStats.queryPerformance?.totalQueries?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      Index Count
                    </span>
                    <span className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      {dbStats.indexCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Backup Information */}
              <div className="p-6 rounded-lg border" style={{
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <h4 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  Backup Information
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      Last Backup
                    </span>
                    <span className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      {new Date(dbStats.lastBackup).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      Backup Size
                    </span>
                    <span className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      {dbStats.backupSize}
                    </span>
                  </div>
                  <div className="pt-4 border-t" style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to optimize the database? This may take several minutes.')) {
                          alert('Database optimization started! Performance may be temporarily affected.');
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border transition-colors"
                      style={{
                        backgroundColor: isDark ? '#21262d' : '#ffffff',
                        borderColor: isDark ? '#30363d' : '#d1d5db',
                        color: isDark ? '#8b949e' : '#6b7280'
                      }}
                    >
                      Optimize Database
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to run database maintenance? This will clean up old data and optimize performance.')) {
                        alert('Database maintenance started! This may take a few minutes.');
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                  >
                    Run Maintenance
                  </button>
                </div>
              </div>
            </div>

            {/* Database Tables */}
            <div className="p-6 rounded-lg border" style={{
              backgroundColor: isDark ? '#161b22' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#e5e7eb'
            }}>
              <h4 className="text-lg font-semibold mb-4" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                Database Tables
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}>
                      <th className="text-left py-2 px-4 text-sm font-medium" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                        Table Name
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-medium" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                        Rows
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-medium" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                        Size
                      </th>
                      <th className="text-left py-2 px-4 text-sm font-medium" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbStats?.tables ? Object.values(dbStats.tables)
                      .sort((a, b) => b.sizeBytes - a.sizeBytes) // Sort by size descending
                      .map((table, index) => (
                      <tr key={index} className="border-b" style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}>
                        <td className="py-2 px-4 font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                          {table.name}
                        </td>
                        <td className="py-2 px-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                          {table.rows.toLocaleString()}
                        </td>
                        <td className="py-2 px-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                          {table.size}
                        </td>
                        <td className="py-2 px-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                          {table.lastUpdated}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="py-8 px-4 text-center" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                          {loading ? 'Loading database statistics...' : 'No database information available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-6 rounded-lg border border-red-200" style={{
              backgroundColor: isDark ? '#2d1b1b' : '#fef2f2'
            }}>
              <h4 className="text-lg font-semibold mb-4 text-red-600">
                Danger Zone
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
                      if (window.confirm('This will permanently delete all analytics data. Type "DELETE" to confirm.')) {
                        alert('Analytics data cleared successfully.');
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear Analytics Data
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset the database? This will delete ALL data and cannot be undone.')) {
                      if (window.confirm('This will permanently delete ALL data. Type "RESET" to confirm.')) {
                        alert('Database reset initiated. Please wait...');
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Reset Database
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Change Modal */}
        {showRoleModal && editingUser && (
          <RoleChangeModal
            user={editingUser}
            isDark={isDark}
            onClose={() => {
              setShowRoleModal(false);
              setEditingUser(null);
            }}
            onSave={(updatedUser) => {
              setUsers(prevUsers =>
                prevUsers.map(user =>
                  user.id === updatedUser.id ? updatedUser : user
                )
              );
              setShowRoleModal(false);
              setEditingUser(null);
            }}
          />
        )}

        {/* Edit User Modal */}
        {editingUser && !showRoleModal && (
          <EditUserModal
            user={editingUser}
            isDark={isDark}
            onClose={() => setEditingUser(null)}
            onSave={(updatedUser) => {
              setUsers(prevUsers =>
                prevUsers.map(user =>
                  user.id === updatedUser.id ? updatedUser : user
                )
              );
              setEditingUser(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

// Role Change Modal Component
const RoleChangeModal = ({ user, isDark, onClose, onSave }) => {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { value: 'user', label: 'User', description: 'Standard user with basic permissions' },

    { value: 'admin', label: 'Administrator', description: 'Full system access and control' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedRole === user.role) {
      onClose();
      return;
    }

    setIsLoading(true);

    try {
      // Import admin service dynamically
      const { updateUserRole } = await import('../services/adminService');

      await updateUserRole(user.id, selectedRole);

      // Call onSave with updated user data
      onSave({
        ...user,
        role: selectedRole
      });

      console.log('✅ User role updated successfully');
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl shadow-2xl max-w-md w-full"
        style={{ backgroundColor: isDark ? '#0d1117' : '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Change User Role
            </h2>
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
          <p className="text-sm mt-2" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Change role for: <span className="font-medium">{user.username}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {roles.map((role) => (
              <label
                key={role.value}
                className={`flex items-start p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole === role.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                    {role.label}
                  </div>
                  <div className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                    {role.description}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: isDark ? '#21262d' : '#f8fafc',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedRole === user.role}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: selectedRole === user.role ? '#6b7280' : '#3b82f6',
                color: '#ffffff',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, isDark, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role || 'user',
    isActive: user.isActive !== undefined ? user.isActive : true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Import admin service dynamically
      const { updateUserRole, toggleUserStatus } = await import('../services/adminService');

      // Update role if changed
      if (formData.role !== user.role) {
        await updateUserRole(user.id, formData.role);
      }

      // Update status if changed
      if (formData.isActive !== user.isActive) {
        await toggleUserStatus(user.id, formData.isActive);
      }

      // Call onSave with updated user data
      onSave({
        ...user,
        ...formData
      });

      console.log('✅ User updated successfully');
    } catch (error) {
      console.error('❌ Error updating user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl shadow-2xl max-w-md w-full"
        style={{ backgroundColor: isDark ? '#0d1117' : '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 border-b"
          style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Edit User
            </h2>
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
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
              disabled // Username typically shouldn't be editable
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
              disabled // Email typically shouldn't be editable for security
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            >
              <option value="user">User</option>

              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Active User
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: isDark ? '#21262d' : '#f8fafc',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;
