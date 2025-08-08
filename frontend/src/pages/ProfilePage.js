import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as bookmarkService from '../services/bookmarkService';
import { changePassword, uploadAvatar } from '../services/authService';
import { useCallback } from 'react';
import { 
  User, 
  // Settings,
  BarChart3, 
  Bookmark, 
  Shield,
  Edit3,
  Save,
  Camera,
  Mail,
  // MapPin,
  // Globe,
  Calendar,
  Award,
  TrendingUp,
  LogOut,
  ArrowLeft,

  Lock,
  // Palette,
  // Download,
  ExternalLink,
  // Check,
  AlertTriangle,
  Search,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  // X
} from 'lucide-react';

const ProfilePage = ({ onClose }) => {
  const { isDark } = useTheme();
  const { user, updateProfile, isAdmin, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    website: ''
  });
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkStats, setBookmarkStats] = useState({});
  const [bookmarkFilters, setBookmarkFilters] = useState({
    type: 'all',
    category: 'all',
    search: ''
  });
  const [expandedBookmarks, setExpandedBookmarks] = useState(new Set());

  // Security state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  // const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Analytics state
  const [userStats, setUserStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const fileInputRef = useRef(null);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || ''
      });
    }
  }, [user]);

  // Fetch stats when analytics tab is accessed or time range changes
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchUserStats(true, selectedTimeRange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedTimeRange]);

  useEffect(() => {
    if (activeTab === 'bookmarks') {
      loadBookmarks();
      loadBookmarkStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bookmarkFilters]);

  useEffect(() => {
    if (activeTab === 'bookmarks') {
      loadBookmarks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bookmarkFilters]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'analytics', label: 'My Analytics', icon: BarChart3 },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  if (isAdmin()) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  const handleSave = async () => {
    try {
      const response = await updateProfile(formData);

      if (response.success) {
        setIsEditing(false);
        // Toast notification is already shown by authService
      } else {
        console.error('Profile update failed:', response.error);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Error toast is already shown by authService
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    try {
      const response = await uploadAvatar(file);
      // Refresh user data to show new avatar
      await refreshUser();
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const getAvatarUrl = (avatarData) => {
    if (!avatarData) return null;
    // If it's already a base64 data URL, return as is
    if (avatarData.startsWith('data:')) return avatarData;
    // If it's a URL, return as is
    if (avatarData.startsWith('http')) return avatarData;
    // If it's a relative path, prepend the backend URL (legacy support)
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${backendUrl}${avatarData}`;
  };

  // Security functions
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      // Error handling is done by the authService (toasts)
    } finally {
      setIsChangingPassword(false);
    }
  };



  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );

    if (doubleConfirm !== 'DELETE') {
      alert('Account deletion cancelled');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert('Account deleted successfully. You will now be logged out.');
        await logout();
        onClose();
      } else {
        const error = await response.json();
        alert(error.error || error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Network error: Failed to delete account. Please try again.');
    }
  };

  // Fetch user statistics
  const fetchUserStats = async (force = false, timeRange = selectedTimeRange) => {
    if (isLoadingStats && !force) return;

    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/users/stats?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUserStats(result.data);
        console.log('✅ Enhanced user stats loaded:', result.data);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      setStatsError(error.message);
      // Fallback to user.stats if API fails
      setUserStats(user?.stats || null);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Manual refresh function
  const handleRefreshStats = () => {
    fetchUserStats(true);
  };

  // Add demo stats function
  const addDemoStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/users/stats/demo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setUserStats(result.data);
        alert('Demo statistics added successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add demo statistics');
      }
    } catch (error) {
      console.error('Demo stats error:', error);
      alert('Failed to add demo statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      setLoadingBookmarks(true);
      const filters = {};

      if (bookmarkFilters.type !== 'all') {
        filters.type = bookmarkFilters.type;
      }
      if (bookmarkFilters.category !== 'all') {
        filters.category = bookmarkFilters.category;
      }
      if (bookmarkFilters.search) {
        filters.search = bookmarkFilters.search;
      }

      const data = await bookmarkService.getBookmarks(filters);
      setBookmarks(data.bookmarks || []);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const loadBookmarkStats = async () => {
    try {
      const stats = await bookmarkService.getBookmarkStats();
      setBookmarkStats(stats);
    } catch (error) {
      console.error('Failed to load bookmark stats:', error);
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      try {
        await bookmarkService.deleteBookmark(bookmarkId);
        setBookmarks(bookmarks.filter(b => b.id !== bookmarkId));
        loadBookmarkStats(); // Refresh stats
      } catch (error) {
        console.error('Failed to delete bookmark:', error);
      }
    }
  };

  const handleToggleFavorite = async (bookmarkId, currentStatus) => {
    try {
      await bookmarkService.toggleFavorite(bookmarkId, !currentStatus);
      setBookmarks(bookmarks.map(b =>
        b.id === bookmarkId ? { ...b, is_favorite: !currentStatus } : b
      ));
      loadBookmarkStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const toggleBookmarkExpansion = (bookmarkId) => {
    setExpandedBookmarks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookmarkId)) {
        newSet.delete(bookmarkId);
      } else {
        newSet.add(bookmarkId);
      }
      return newSet;
    });
  };

  // Solution formatting functions (same as in MultipleSolutionsDisplay)
  const formatInlineText = (text) => {
    // Handle **bold** text
    return text.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} style={{ color: isDark ? '#f1f5f9' : '#1f2937' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const formatSolutionText = (text) => {
    // Split by double newlines to create sections
    const sections = text.split('\n\n');

    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return null;

      // Check for headers (## Header)
      if (trimmedSection.startsWith('## ')) {
        const headerText = trimmedSection.replace('## ', '');
        return (
          <h3
            key={index}
            className="text-lg font-semibold mt-4 mb-2 pb-1 border-b"
            style={{
              color: isDark ? '#60a5fa' : '#1e40af',
              borderColor: isDark ? '#30363d' : '#e5e7eb'
            }}
          >
            {headerText}
          </h3>
        );
      }

      // Check for bullet points (• item)
      if (trimmedSection.includes('•')) {
        const items = trimmedSection.split('\n').filter(line => line.trim().startsWith('•'));
        if (items.length > 0) {
          return (
            <div key={index} className="mb-3">
              <ul className="space-y-1">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mt-2 mr-2 flex-shrink-0"
                      style={{
                        backgroundColor: isDark ? '#60a5fa' : '#3b82f6'
                      }}
                    ></span>
                    <span className="text-sm leading-relaxed">
                      {formatInlineText(item.replace('•', '').trim())}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }

      // Regular paragraph
      return (
        <p key={index} className="mb-3 text-sm leading-relaxed">
          {formatInlineText(trimmedSection)}
        </p>
      );
    }).filter(Boolean);
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    // Find the first paragraph or section for preview
    const firstSection = text.split('\n\n')[0];
    if (firstSection.length <= maxLength) return firstSection;
    return text.substring(0, maxLength);
  };

  const renderProfile = () => (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex items-start space-x-6">
        <div className="relative">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff' }}
          >
            {user.avatar ? (
              <img
                src={getAvatarUrl(user.avatar)}
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}
              style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff' }}
            >
              <User className="h-12 w-12" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
            </div>
          </div>
          <button
            onClick={handleAvatarClick}
            className="absolute -bottom-2 -right-2 p-2 rounded-full hover:bg-blue-600 transition-colors"
            style={{ backgroundColor: isDark ? '#3b82f6' : '#3b82f6' }}
            title="Upload profile picture"
          >
            <Camera className="h-4 w-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.username
                }
              </h2>
              <p className="text-lg" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                @{user.username}
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: user.role === 'admin'
                      ? '#dc2626'
                      : user.role === 'moderator'
                      ? '#f59e0b'
                      : '#10b981',
                    color: '#ffffff'
                  }}
                >
                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                </span>
                {user.stats?.achievements?.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Award className="h-4 w-4" style={{ color: '#fbbf24' }} />
                    <span className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      {user.stats.achievements.length} achievements
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: isDark ? '#21262d' : '#f8fafc',
                color: isDark ? '#8b949e' : '#6b7280'
              }}
            >
              <Edit3 className="h-4 w-4" />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Email
            </label>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
              <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Member Since
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
              <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          disabled={!isEditing}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: isDark ? '#21262d' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#d1d5db',
            color: isDark ? '#f0f6fc' : '#111827'
          }}
          placeholder="Tell us about yourself..."
        />
      </div>

      {isEditing && (
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: isDark ? '#21262d' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#d1d5db',
              color: isDark ? '#8b949e' : '#6b7280'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff'
            }}
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderStats = () => {
    // Show loading state
    if (isLoadingStats) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Your Statistics
          </h3>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
              Loading your statistics...
            </span>
          </div>
        </div>
      );
    }

    // Show error state with retry option
    if (statsError) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Your Statistics
          </h3>
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Failed to load statistics</p>
            <p className="text-sm mb-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
              {statsError}
            </p>
            <button
              onClick={handleRefreshStats}
              disabled={isLoadingStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoadingStats ? 'Loading...' : 'Try Again'}
            </button>
          </div>
        </div>
      );
    }

    // Use fetched stats or fallback to user.stats
    const stats = userStats || user?.stats || {};
    const statCards = [
      { label: 'Total Solutions', value: stats.totalSolutions || 0, icon: BarChart3, color: '#3b82f6' },
      { label: 'Success Rate', value: `${stats.successRate || 0}%`, icon: TrendingUp, color: '#10b981' },
      { label: 'Total Likes', value: stats.totalLikes || 0, icon: Award, color: '#f59e0b' },
      { label: 'Streak Days', value: stats.streakDays || 0, icon: Calendar, color: '#8b5cf6' }
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Your Analytics Dashboard
          </h3>

          <div className="flex items-center space-x-2">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-1 rounded-lg text-sm border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            <button
              onClick={addDemoStats}
              disabled={isLoadingStats}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50"
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff'
              }}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Add Demo Data</span>
            </button>

            <button
              onClick={handleRefreshStats}
              disabled={isLoadingStats}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50"
              style={{
                backgroundColor: isDark ? '#21262d' : '#f8fafc',
                color: isDark ? '#8b949e' : '#6b7280',
                border: `1px solid ${isDark ? '#30363d' : '#d1d5db'}`
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="text-xs px-2 py-1 rounded" style={{
                    backgroundColor: isDark ? '#21262d' : '#f1f5f9',
                    color: isDark ? '#8b949e' : '#6b7280'
                  }}>
                    {stats.timeRange || '30d'}
                  </div>
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

        {/* Top Subreddits */}
        {stats.topSubreddits && stats.topSubreddits.length > 0 && (
          <div className="p-4 rounded-lg border" style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}>
            <h4 className="font-medium mb-3" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Most Active Subreddits
            </h4>
            <div className="space-y-2">
              {stats.topSubreddits.map((subreddit, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                    r/{subreddit.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 rounded-full" style={{ backgroundColor: isDark ? '#21262d' : '#f1f5f9' }}>
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(subreddit.count / stats.topSubreddits[0].count) * 100}%`,
                          backgroundColor: '#3b82f6'
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      {subreddit.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Activity Chart */}
        {stats.dailyActivity && stats.dailyActivity.length > 0 && (
          <div className="p-4 rounded-lg border" style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}>
            <h4 className="font-medium mb-3" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Daily Activity (Last 7 Days)
            </h4>
            <div className="flex items-end justify-between space-x-2 h-32">
              {stats.dailyActivity.map((day, index) => {
                const maxActivity = Math.max(...stats.dailyActivity.map(d => d.solutions + d.feedback));
                const height = maxActivity > 0 ? ((day.solutions + day.feedback) / maxActivity) * 100 : 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="flex-1 flex items-end">
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${height}%`,
                          backgroundColor: height > 0 ? '#3b82f6' : isDark ? '#21262d' : '#f1f5f9',
                          minHeight: '4px'
                        }}
                      />
                    </div>
                    <div className="text-xs mt-2" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </div>
                    <div className="text-xs font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      {day.solutions + day.feedback}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {stats.totalTimeSpent > 0 && (
          <div className="p-4 rounded-lg border" style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}>
            <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Usage Summary
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>Time Spent:</span>
                <span className="ml-2 font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {Math.round(stats.totalTimeSpent / 60)} minutes
                </span>
              </div>
              <div>
                <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>Avg Response Time:</span>
                <span className="ml-2 font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {stats.avgResponseTime || 0}s
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        {stats.achievements && stats.achievements.length > 0 && (
          <div>
            <h4 className="text-md font-semibold mb-3" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Achievements
            </h4>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.map((achievement, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                    color: isDark ? '#60a5fa' : '#3b82f6'
                  }}
                >
                  🏆 {achievement}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!stats.totalSolutions || stats.totalSolutions === 0) && (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
            <p className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              No activity yet
            </p>
            <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
              Start using the app to see your statistics!
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!user) return null;

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
                Profile Settings
              </h1>
              <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                Manage your account settings and preferences
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b px-6 flex-shrink-0" style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}>
        <div className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
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
        minHeight: 0 // Important for flex child to shrink
      }}>
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'analytics' && renderStats()}

        {activeTab === 'bookmarks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  My Bookmarks
                </h3>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  {bookmarkStats.total || 0} saved items
                </p>
              </div>
              <button
                onClick={loadBookmarks}
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

            {/* Bookmark Stats */}
            {bookmarkStats.total > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}>
                  <p className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                    {bookmarkStats.total || 0}
                  </p>
                  <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                    Total
                  </p>
                </div>
                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}>
                  <p className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                    {bookmarkStats.favorites || 0}
                  </p>
                  <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                    Favorites
                  </p>
                </div>
                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}>
                  <p className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                    {bookmarkStats.byType?.solution || 0}
                  </p>
                  <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                    Solutions
                  </p>
                </div>
                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}>
                  <p className="text-2xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                    {bookmarkStats.byType?.post || 0}
                  </p>
                  <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                    Posts
                  </p>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                  style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                <input
                  type="text"
                  placeholder="Search bookmarks..."
                  value={bookmarkFilters.search}
                  onChange={(e) => setBookmarkFilters({ ...bookmarkFilters, search: e.target.value })}
                  className="pl-10 pr-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: isDark ? '#21262d' : '#ffffff',
                    borderColor: isDark ? '#30363d' : '#d1d5db',
                    color: isDark ? '#f0f6fc' : '#111827'
                  }}
                />
              </div>

              <select
                value={bookmarkFilters.type}
                onChange={(e) => setBookmarkFilters({ ...bookmarkFilters, type: e.target.value })}
                className="px-3 py-2 rounded-lg border"
                style={{
                  backgroundColor: isDark ? '#21262d' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#d1d5db',
                  color: isDark ? '#f0f6fc' : '#111827'
                }}
              >
                <option value="all">All Types</option>
                <option value="solution">Solutions</option>
                <option value="post">Posts</option>
                <option value="external">Links</option>
              </select>
            </div>

            {/* Bookmarks List */}
            {loadingBookmarks ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Loading bookmarks...
                </p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 mx-auto mb-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                <h4 className="text-lg font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  No bookmarks yet
                </h4>
                <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Save solutions, posts, and links you find helpful!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: isDark ? '#161b22' : '#ffffff',
                      borderColor: isDark ? '#30363d' : '#e5e7eb'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                            {bookmark.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            bookmark.type === 'solution' ? 'bg-blue-100 text-blue-800' :
                            bookmark.type === 'post' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {bookmark.type}
                          </span>
                          {bookmark.is_favorite && (
                            <Award className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>

                        {bookmark.description && (
                          <p className="text-sm mb-2" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                            {bookmark.description}
                          </p>
                        )}

                        {bookmark.subreddit && (
                          <p className="text-sm mb-2" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>
                            r/{bookmark.subreddit}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-xs" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>
                          <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                          {bookmark.category && <span>• {bookmark.category}</span>}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleToggleFavorite(bookmark.id, bookmark.is_favorite)}
                          className="p-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                          title={bookmark.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Award className={`h-4 w-4 ${bookmark.is_favorite ? 'text-yellow-500' : 'text-gray-400'}`} />
                        </button>

                        {(bookmark.post_url || bookmark.external_url) && (
                          <button
                            onClick={() => window.open(bookmark.post_url || bookmark.external_url, '_blank')}
                            className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Open link"
                          >
                            <ExternalLink className="h-4 w-4 text-blue-600" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteBookmark(bookmark.id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete bookmark"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {bookmark.solution_content && (
                      <div className="mt-3 p-4 rounded-lg border-l-4 border-blue-500" style={{
                        backgroundColor: isDark ? '#0d1117' : '#f8fafc'
                      }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                              {expandedBookmarks.has(bookmark.id) ? (
                                // Show formatted full solution
                                <div className="solution-content">
                                  {formatSolutionText(bookmark.solution_content)}
                                </div>
                              ) : (
                                // Show formatted truncated solution
                                <div className="solution-content">
                                  {formatSolutionText(truncateText(bookmark.solution_content, 200))}
                                  {bookmark.solution_content.length > 200 && (
                                    <span className="text-gray-500">...</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {bookmark.solution_content.length > 200 && (
                            <button
                              onClick={() => toggleBookmarkExpansion(bookmark.id)}
                              className="ml-3 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
                              title={expandedBookmarks.has(bookmark.id) ? 'Show less' : 'Show more'}
                            >
                              {expandedBookmarks.has(bookmark.id) ? (
                                <ChevronUp className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                              ) : (
                                <ChevronDown className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Security Settings
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border" style={{
                backgroundColor: isDark ? '#161b22' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}>
                <h4 className="font-medium mb-3" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  Change Password
                </h4>
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 rounded border"
                        style={{
                          backgroundColor: isDark ? '#21262d' : '#ffffff',
                          borderColor: isDark ? '#30363d' : '#d1d5db',
                          color: isDark ? '#f0f6fc' : '#111827'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPasswords.current ?
                          <EyeOff className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} /> :
                          <Eye className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                        }
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 rounded border"
                        style={{
                          backgroundColor: isDark ? '#21262d' : '#ffffff',
                          borderColor: isDark ? '#30363d' : '#d1d5db',
                          color: isDark ? '#f0f6fc' : '#111827'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPasswords.new ?
                          <EyeOff className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} /> :
                          <Eye className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                        }
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 rounded border"
                        style={{
                          backgroundColor: isDark ? '#21262d' : '#ffffff',
                          borderColor: isDark ? '#30363d' : '#d1d5db',
                          color: isDark ? '#f0f6fc' : '#111827'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        {showPasswords.confirm ?
                          <EyeOff className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} /> :
                          <Eye className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                        }
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>



              <div className="p-4 rounded-lg border border-red-200" style={{
                backgroundColor: isDark ? '#2d1b1b' : '#fef2f2'
              }}>
                <h4 className="font-medium mb-3 text-red-600">
                  Danger Zone
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-600">
                        Delete Account
                      </p>
                      <p className="text-sm text-red-500">
                        Permanently delete your account and all data
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
                      className="px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'admin' && isAdmin() && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
              Admin Panel
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                className="p-4 rounded-lg border text-left transition-colors hover:border-blue-500"
                style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}
                onClick={() => {
                  onClose();
                  // This would open the admin dashboard
                  window.dispatchEvent(new CustomEvent('openAdminDashboard'));
                }}
              >
                <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  User Management
                </h4>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Manage users, roles, and permissions
                </p>
              </button>

              <button
                className="p-4 rounded-lg border text-left transition-colors hover:border-blue-500"
                style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}
                onClick={() => {
                  onClose();
                  // This would open the analytics dashboard
                  window.dispatchEvent(new CustomEvent('openAnalyticsDashboard'));
                }}
              >
                <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  System Analytics
                </h4>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  View system-wide usage and performance metrics
                </p>
              </button>

              <button
                className="p-4 rounded-lg border text-left transition-colors hover:border-blue-500"
                style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}
              >
                <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  System Settings
                </h4>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Configure application settings and preferences
                </p>
              </button>

              <button
                className="p-4 rounded-lg border text-left transition-colors hover:border-blue-500"
                style={{
                  backgroundColor: isDark ? '#161b22' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#e5e7eb'
                }}
              >
                <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  Database Management
                </h4>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Monitor database health and performance
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
