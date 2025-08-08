const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.username = data.username;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.phone = data.phone;
    this.bio = data.bio;
    this.location = data.location;
    this.website = data.website;
    this.avatar = data.avatar;
    this.role = data.role || 'user'; // user, admin
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.preferences = data.preferences || this.getDefaultPreferences();
    this.createdAt = data.createdAt || new Date().toISOString();
    this.lastLoginAt = data.lastLoginAt;
    this.emailVerified = data.emailVerified || false;
    this.stats = data.stats || this.getDefaultStats();
  }

  /**
   * Get default user preferences
   */
  getDefaultPreferences() {
    return {
      theme: 'system', // light, dark, system
      defaultTemplate: 'general',
      defaultTone: 'empathetic',
      defaultLength: 'medium',
      enableFollowupQuestions: false,
      emailNotifications: true,
      pushNotifications: false,
      analyticsOptIn: true,
      favoriteSubreddits: [],
      language: 'en',
      timezone: 'UTC'
    };
  }

  /**
   * Get default user stats
   */
  getDefaultStats() {
    return {
      totalSolutions: 0,
      totalLikes: 0,
      totalDislikes: 0,
      successRate: 0,
      avgResponseTime: 0,
      totalTimeSpent: 0,
      streakDays: 0,
      lastActiveDate: null,
      achievements: []
    };
  }

  /**
   * Hash password before saving
   */
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  /**
   * Compare password with hash
   */
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Generate JWT token
   */
  generateToken() {
    const payload = {
      id: this.id,
      email: this.email,
      username: this.username,
      role: this.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken() {
    const payload = {
      id: this.id,
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    });
  }

  /**
   * Update last login time
   */
  updateLastLogin() {
    this.lastLoginAt = new Date().toISOString();
  }

  /**
   * Update user stats
   */
  updateStats(updates) {
    this.stats = { ...this.stats, ...updates };
  }

  /**
   * Add achievement
   */
  addAchievement(achievement) {
    if (!this.stats.achievements.includes(achievement)) {
      this.stats.achievements.push(achievement);
    }
  }

  /**
   * Update preferences
   */
  updatePreferences(updates) {
    this.preferences = { ...this.preferences, ...updates };
  }

  /**
   * Get public profile (without sensitive data)
   */
  getPublicProfile() {
    return {
      id: this.id,
      email: this.email, // Include email for profile display
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
      bio: this.bio,
      location: this.location,
      website: this.website,
      socialLinks: this.socialLinks,
      role: this.role, // Include role for permission checks
      createdAt: this.createdAt,
      stats: {
        totalSolutions: this.stats.totalSolutions,
        successRate: this.stats.successRate,
        achievements: this.stats.achievements,
        streakDays: this.stats.streakDays
      }
    };
  }

  /**
   * Get user data for token payload
   */
  getTokenData() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      role: this.role,
      isActive: this.isActive,
      emailVerified: this.emailVerified
    };
  }

  /**
   * Validate user data
   */
  validate() {
    const errors = [];

    if (!this.email || !this.isValidEmail(this.email)) {
      errors.push('Valid email is required');
    }

    if (!this.username || this.username.length < 3) {
      errors.push('Username must be at least 3 characters');
    }

    if (!this.password || this.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!['user', 'admin'].includes(this.role)) {
      errors.push('Invalid role');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission) {
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

    return rolePermissions[this.role]?.includes(permission) || false;
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.role === 'admin';
  }



  /**
   * Sanitize user data for storage
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      isActive: this.isActive,
      preferences: this.preferences,
      createdAt: this.createdAt,
      lastLoginAt: this.lastLoginAt,
      emailVerified: this.emailVerified,
      avatar: this.avatar,
      bio: this.bio,
      location: this.location,
      website: this.website,
      socialLinks: this.socialLinks,
      stats: this.stats
    };
  }
}

module.exports = User;
