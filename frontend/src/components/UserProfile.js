import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Settings,
  BarChart3,
  Bookmark,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  Mail,
  MapPin,
  Globe,
  Calendar,
  Award,
  TrendingUp,
  LogOut
} from 'lucide-react';
import { uploadAvatar } from '../services/authService';

const UserProfile = ({ onClose }) => {
  const { isDark } = useTheme();
  const { user, updateProfile, isAdmin, isModerator, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    website: '',
    avatar: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
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
      console.log('📤 Uploading avatar file:', file.name);
      const response = await uploadAvatar(file);
      console.log('✅ Avatar upload response:', response);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh user data to show new avatar
      const updatedUser = await refreshUser();
      console.log('🔄 Updated user after refresh:', updatedUser);
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

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (isAdmin() || isModerator()) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  if (!user) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: isDark ? '#0d1117' : '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-6 border-b"
          style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff' }}
                >
                  {user.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={user.username}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}
                    style={{ backgroundColor: isDark ? '#1e293b' : '#eff6ff' }}
                  >
                    <User className="h-8 w-8" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
                  </div>
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="absolute -bottom-1 -right-1 p-1 rounded-full hover:bg-blue-600 transition-colors"
                  style={{ backgroundColor: isDark ? '#3b82f6' : '#3b82f6' }}
                  title="Upload profile picture"
                >
                  <Camera className="h-3 w-3 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              
              <div>
                <h2 className="text-xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username
                  }
                </h2>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  @{user.username}
                </p>
                <div className="flex items-center space-x-2 mt-1">
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
                    {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                  </span>
                  {user.stats?.achievements?.length > 0 && (
                    <Award className="h-4 w-4" style={{ color: '#fbbf24' }} />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={async () => {
                  await logout();
                  onClose();
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: isDark ? '#21262d' : '#f8fafc',
                  color: isDark ? '#8b949e' : '#6b7280'
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
          {activeTab === 'profile' && (
            <ProfileTab 
              user={user}
              profileData={profileData}
              isEditing={isEditing}
              onInputChange={handleInputChange}
              onEdit={() => setIsEditing(true)}
              onSave={handleSaveProfile}
              onCancel={() => {
                setIsEditing(false);
                setProfileData({
                  firstName: user.firstName || '',
                  lastName: user.lastName || '',
                  bio: user.bio || '',
                  location: user.location || '',
                  website: user.website || '',
                  avatar: user.avatar || ''
                });
              }}
              isDark={isDark}
            />
          )}
          
          {activeTab === 'stats' && (
            <StatsTab user={user} isDark={isDark} />
          )}
          
          {activeTab === 'bookmarks' && (
            <BookmarksTab user={user} isDark={isDark} />
          )}
          
          {activeTab === 'settings' && (
            <SettingsTab user={user} isDark={isDark} />
          )}
          
          {activeTab === 'admin' && (isAdmin() || isModerator()) && (
            <AdminTab user={user} isDark={isDark} />
          )}
        </div>
      </div>
    </div>
  );
};

// Profile Tab Component
const ProfileTab = ({ user, profileData, isEditing, onInputChange, onEdit, onSave, onCancel, isDark }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
          Profile Information
        </h3>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: isDark ? '#21262d' : '#f8fafc',
              color: isDark ? '#f0f6fc' : '#111827'
            }}
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={onSave}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: '#10b981', color: '#ffffff' }}
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button
              onClick={onCancel}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: isDark ? '#21262d' : '#f8fafc',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            First Name
          </label>
          {isEditing ? (
            <input
              type="text"
              name="firstName"
              value={profileData.firstName}
              onChange={onInputChange}
              className="w-full px-4 py-3 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            />
          ) : (
            <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
              {user.firstName || 'Not provided'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Last Name
          </label>
          {isEditing ? (
            <input
              type="text"
              name="lastName"
              value={profileData.lastName}
              onChange={onInputChange}
              className="w-full px-4 py-3 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#21262d' : '#ffffff',
                borderColor: isDark ? '#30363d' : '#d1d5db',
                color: isDark ? '#f0f6fc' : '#111827'
              }}
            />
          ) : (
            <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
              {user.lastName || 'Not provided'}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
          Bio
        </label>
        {isEditing ? (
          <textarea
            name="bio"
            value={profileData.bio}
            onChange={onInputChange}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border resize-none"
            style={{
              backgroundColor: isDark ? '#21262d' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#d1d5db',
              color: isDark ? '#f0f6fc' : '#111827'
            }}
            placeholder="Tell us about yourself..."
          />
        ) : (
          <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            {user.bio || 'No bio provided'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Location
          </label>
          {isEditing ? (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                     style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
              <input
                type="text"
                name="location"
                value={profileData.location}
                onChange={onInputChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border"
                style={{
                  backgroundColor: isDark ? '#21262d' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#d1d5db',
                  color: isDark ? '#f0f6fc' : '#111827'
                }}
                placeholder="Your location"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
              <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                {user.location || 'Not provided'}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Website
          </label>
          {isEditing ? (
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                     style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
              <input
                type="url"
                name="website"
                value={profileData.website}
                onChange={onInputChange}
                className="w-full pl-10 pr-4 py-3 rounded-lg border"
                style={{
                  backgroundColor: isDark ? '#21262d' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#d1d5db',
                  color: isDark ? '#f0f6fc' : '#111827'
                }}
                placeholder="https://your-website.com"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
              {user.website ? (
                <a 
                  href={user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {user.website}
                </a>
              ) : (
                <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  Not provided
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-6 pt-4 border-t" style={{ borderColor: isDark ? '#30363d' : '#e5e7eb' }}>
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>{user.email}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
          <span style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// Stats Tab Component
const StatsTab = ({ user, isDark }) => {
  const stats = user.stats || {};

  const statCards = [
    { label: 'Total Solutions', value: stats.totalSolutions || 0, icon: BarChart3, color: '#3b82f6' },
    { label: 'Success Rate', value: `${stats.successRate || 0}%`, icon: TrendingUp, color: '#10b981' },
    { label: 'Total Likes', value: stats.totalLikes || 0, icon: Award, color: '#f59e0b' },
    { label: 'Streak Days', value: stats.streakDays || 0, icon: Calendar, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
        Your Statistics
      </h3>

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
    </div>
  );
};

// Bookmarks Tab Component
const BookmarksTab = ({ user, isDark }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
        Saved Solutions
      </h3>

      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 mx-auto mb-4" style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
        <p style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
          No bookmarks yet. Save solutions you find helpful!
        </p>
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ user, isDark }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
        Account Settings
      </h3>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border" style={{
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#e5e7eb'
        }}>
          <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Email Notifications
          </h4>
          <p className="text-sm mb-3" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Receive updates about your solutions and account activity
          </p>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span style={{ color: isDark ? '#f0f6fc' : '#111827' }}>Enable email notifications</span>
          </label>
        </div>

        <div className="p-4 rounded-lg border" style={{
          backgroundColor: isDark ? '#161b22' : '#ffffff',
          borderColor: isDark ? '#30363d' : '#e5e7eb'
        }}>
          <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            Privacy Settings
          </h4>
          <p className="text-sm mb-3" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            Control how your data is used for analytics
          </p>
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" defaultChecked />
            <span style={{ color: isDark ? '#f0f6fc' : '#111827' }}>Allow analytics data collection</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Admin Tab Component
const AdminTab = ({ user, isDark }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
        Admin Panel
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          className="p-4 rounded-lg border text-left transition-colors"
          style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
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
          className="p-4 rounded-lg border text-left transition-colors"
          style={{
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderColor: isDark ? '#30363d' : '#e5e7eb'
          }}
        >
          <h4 className="font-medium mb-2" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
            System Analytics
          </h4>
          <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
            View system-wide usage and performance metrics
          </p>
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
