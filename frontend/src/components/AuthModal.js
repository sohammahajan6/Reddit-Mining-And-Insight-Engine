import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  LogIn,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AuthModal = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { isDark } = useTheme();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(defaultMode); // 'login' or 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
    role: 'user',
    phone: '',
    adminKey: ''
  });
  const [rememberMe, setRememberMe] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role') {
      console.log('🔍 Role changed to:', value);
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return false;
    }

    // Sign in validation
    if (mode === 'login') {
      if (formData.role === 'admin') {
        if (!formData.email.endsWith('@redditai.com')) {
          setError('Admin accounts must use @redditai.com email domain');
          return false;
        }
        if (!formData.adminKey) {
          setError('Admin key is required for admin login');
          return false;
        }
        if (formData.adminKey !== '123') {
          setError('Invalid admin key');
          return false;
        }
      }
    }

    if (mode === 'register') {
      if (!formData.username) {
        setError('Username is required');
        return false;
      }
      if (!formData.firstName || !formData.lastName) {
        setError('First name and last name are required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }

      // Role-specific validation
      if (formData.role === 'admin') {
        if (!formData.email.endsWith('@redditai.com')) {
          setError('Admin accounts must use @redditai.com email domain');
          return false;
        }
        if (!formData.adminKey) {
          setError('Admin key is required for admin accounts');
          return false;
        }
        if (formData.adminKey !== '123') {
          setError('Invalid admin key');
          return false;
        }
      }

      // Phone validation (optional but if provided should be valid)
      if (formData.phone && !/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) {
        setError('Please enter a valid phone number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;
      
      if (mode === 'login') {
        console.log('🔍 About to login with:', { email: formData.email, role: formData.role, hasAdminKey: !!formData.adminKey });
        result = await login(formData.email, formData.password, rememberMe, formData.role, formData.adminKey);
      } else {
        result = await register({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          phone: formData.phone,
          adminKey: formData.adminKey
        });
      }

      if (result.success) {
        setSuccess(mode === 'login' ? 'Login successful!' : 'Account created successfully!');
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      username: '',
      firstName: '',
      lastName: '',
      confirmPassword: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
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
                {mode === 'login' ? (
                  <LogIn className="h-6 w-6" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
                ) : (
                  <UserPlus className="h-6 w-6" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: isDark ? '#f0f6fc' : '#111827' }}>
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  {mode === 'login' 
                    ? 'Sign in to your account' 
                    : 'Join the Reddit AI community'
                  }
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
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Selection (FIRST - Both Login and Register) */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: isDark ? '#f0f6fc' : '#111827' }}
              >
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: isDark ? '#21262d' : '#ffffff',
                  borderColor: isDark ? '#30363d' : '#d1d5db',
                  color: isDark ? '#f0f6fc' : '#111827'
                }}
              >
                <option value="user">👤 Regular User</option>
                <option value="admin">👑 Administrator</option>
              </select>
              <p className="text-xs mt-1" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                {mode === 'login'
                  ? (formData.role === 'admin'
                      ? '🔐 Admin login requires @redditai.com email domain and admin key'
                      : '✨ Sign in to access your account'
                    )
                  : (formData.role === 'admin'
                      ? '⚠️ Admin accounts require @redditai.com email domain and admin key'
                      : '✨ Perfect for browsing and getting AI-powered solutions'
                    )
                }
              </p>
            </div>

            {/* Admin Key (Admin only - Both Login and Register) */}
            {formData.role === 'admin' && (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                >
                  Admin Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                        style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                  <input
                    type="password"
                    name="adminKey"
                    value={formData.adminKey}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: isDark ? '#21262d' : '#ffffff',
                      borderColor: isDark ? '#30363d' : '#d1d5db',
                      color: isDark ? '#f0f6fc' : '#111827'
                    }}
                    placeholder="Enter admin key"
                    required
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  🔐 Contact your system administrator for the admin key
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: isDark ? '#f0f6fc' : '#111827' }}
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                      style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: isDark ? '#21262d' : '#ffffff',
                    borderColor: isDark ? '#30363d' : '#d1d5db',
                    color: isDark ? '#f0f6fc' : '#111827'
                  }}
                  placeholder={formData.role === 'admin' ? 'admin@redditai.com' : 'Enter your email'}
                  required
                />
              </div>
            </div>

            {/* Username (Register only) */}
            {mode === 'register' && (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                >
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                        style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: isDark ? '#21262d' : '#ffffff',
                      borderColor: isDark ? '#30363d' : '#d1d5db',
                      color: isDark ? '#f0f6fc' : '#111827'
                    }}
                    placeholder="Choose a unique username"
                    required
                  />
                </div>
              </div>
            )}

            {/* Name fields (Register only) */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: isDark ? '#21262d' : '#ffffff',
                      borderColor: isDark ? '#30363d' : '#d1d5db',
                      color: isDark ? '#f0f6fc' : '#111827'
                    }}
                    placeholder="First name"
                    required
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: isDark ? '#21262d' : '#ffffff',
                      borderColor: isDark ? '#30363d' : '#d1d5db',
                      color: isDark ? '#f0f6fc' : '#111827'
                    }}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Phone Number (Register only) */}
            {mode === 'register' && (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                >
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: isDark ? '#21262d' : '#ffffff',
                    borderColor: isDark ? '#30363d' : '#d1d5db',
                    color: isDark ? '#f0f6fc' : '#111827'
                  }}
                  placeholder="+1 (555) 123-4567"
                />
                <p className="text-xs mt-1" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
                  📱 Optional - for account recovery and notifications
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: isDark ? '#f0f6fc' : '#111827' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                      style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: isDark ? '#21262d' : '#ffffff',
                    borderColor: isDark ? '#30363d' : '#d1d5db',
                    color: isDark ? '#f0f6fc' : '#111827'
                  }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: isDark ? '#8b949e' : '#6b7280' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: isDark ? '#f0f6fc' : '#111827' }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                        style={{ color: isDark ? '#8b949e' : '#6b7280' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      backgroundColor: isDark ? '#21262d' : '#ffffff',
                      borderColor: isDark ? '#30363d' : '#d1d5db',
                      color: isDark ? '#f0f6fc' : '#111827'
                    }}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div 
                className="flex items-center space-x-2 p-3 rounded-lg"
                style={{ backgroundColor: isDark ? '#2d1b1b' : '#fef2f2' }}
              >
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">{error}</span>
              </div>
            )}

            {success && (
              <div 
                className="flex items-center space-x-2 p-3 rounded-lg"
                style={{ backgroundColor: isDark ? '#1b2d1b' : '#f0fdf4' }}
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">{success}</span>
              </div>
            )}

            {/* Remember Me (Login only) */}
            {mode === 'login' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm"
                  style={{ color: isDark ? '#8b949e' : '#6b7280' }}
                >
                  Remember me for future visits
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: isDark ? '#3b82f6' : '#3b82f6',
                color: '#ffffff'
              }}
            >
              {isLoading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: isDark ? '#8b949e' : '#6b7280' }}>
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={switchMode}
                className="ml-1 font-medium transition-colors"
                style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
