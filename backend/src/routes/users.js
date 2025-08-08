const express = require('express');
const Joi = require('joi');
const UserRepository = require('../repositories/UserRepository');
const { authenticate, requireAdmin, requireOwnership } = require('../middleware/auth');
const { db } = require('../config/database');

const router = express.Router();
const userRepository = new UserRepository();

// Validation schemas
const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  bio: Joi.string().max(500).optional(),
  location: Joi.string().max(100).optional(),
  website: Joi.string().uri().optional(),
  avatar: Joi.string().uri().optional()
});

const updatePreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'system').optional(),
  defaultTemplate: Joi.string().valid('general', 'relationship', 'career', 'technical', 'social').optional(),
  defaultTone: Joi.string().valid('empathetic', 'professional', 'casual', 'direct').optional(),
  defaultLength: Joi.string().valid('short', 'medium', 'detailed').optional(),
  enableFollowupQuestions: Joi.boolean().optional(),
  emailNotifications: Joi.boolean().optional(),
  pushNotifications: Joi.boolean().optional(),
  analyticsOptIn: Joi.boolean().optional(),
  favoriteSubreddits: Joi.array().items(Joi.string()).optional(),
  language: Joi.string().optional(),
  timezone: Joi.string().optional()
});

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.getPublicProfile(),
        preferences: req.user.preferences,
        stats: req.user.stats
      }
    });

  } catch (error) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const updatedUser = await userRepository.update(req.user.id, value);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * PUT /api/users/preferences
 * Update current user's preferences
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const { error, value } = updatePreferencesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const updatedUser = await userRepository.updatePreferences(req.user.id, value);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: updatedUser.preferences
      }
    });

  } catch (error) {
    console.error('❌ Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * GET /api/users/stats
 * Get current user's comprehensive statistics from database
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const timeRange = req.query.timeRange || '30d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    console.log(`📊 Fetching user stats for ${userId} (${timeRange})`);

    // Get analytics events for this user
    const analyticsEvents = await db('analytics_events')
      .where('user_id', userId)
      .where('created_at', '>=', startDate)
      .orderBy('created_at', 'desc');

    // Get user data for baseline stats
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate comprehensive statistics
    const stats = calculateUserStats(analyticsEvents, user, timeRange);

    res.json({
      success: true,
      data: stats,
      metadata: {
        timeRange,
        totalEvents: analyticsEvents.length,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics'
    });
  }
});

/**
 * Calculate comprehensive user statistics from analytics events
 */
function calculateUserStats(events, user, timeRange) {
  const solutionEvents = events.filter(e => e.event_type === 'solution_generated');
  const feedbackEvents = events.filter(e => e.event_type === 'user_feedback');
  const loginEvents = events.filter(e => e.event_type === 'user_login');

  // Basic counts
  const totalSolutions = solutionEvents.length;
  const totalLikes = feedbackEvents.filter(e => e.user_rating === 'like').length;
  const totalDislikes = feedbackEvents.filter(e => e.user_rating === 'dislike').length;
  const totalFeedback = feedbackEvents.length;

  // Success rate calculation
  const successRate = totalFeedback > 0 ?
    Math.round((totalLikes / totalFeedback) * 100) : 0;

  // Average response time
  const avgResponseTime = solutionEvents.length > 0 ?
    Math.round(solutionEvents.reduce((sum, e) => sum + (parseFloat(e.generation_time) || 0), 0) / solutionEvents.length * 100) / 100 : 0;

  // Total time spent (sum of generation times)
  const totalTimeSpent = Math.round(
    solutionEvents.reduce((sum, e) => sum + (parseFloat(e.generation_time) || 0), 0)
  );

  // Activity streak calculation
  const streakDays = calculateStreakDays(events);

  // Most used subreddits
  const subredditCounts = {};
  solutionEvents.forEach(e => {
    if (e.subreddit) {
      subredditCounts[e.subreddit] = (subredditCounts[e.subreddit] || 0) + 1;
    }
  });

  const topSubreddits = Object.entries(subredditCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Solution templates usage
  const templateCounts = {};
  solutionEvents.forEach(e => {
    if (e.solution_template) {
      templateCounts[e.solution_template] = (templateCounts[e.solution_template] || 0) + 1;
    }
  });

  const topTemplates = Object.entries(templateCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([template, count]) => ({ template, count }));

  // Recent activity (last 7 days)
  const recentEvents = events.filter(e => {
    const eventDate = new Date(e.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return eventDate >= weekAgo;
  });

  // Daily activity for the last 7 days
  const dailyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate >= dayStart && eventDate <= dayEnd;
    });

    dailyActivity.push({
      date: dayStart.toISOString().split('T')[0],
      solutions: dayEvents.filter(e => e.event_type === 'solution_generated').length,
      feedback: dayEvents.filter(e => e.event_type === 'user_feedback').length
    });
  }

  // Generate achievements based on activity
  const achievements = generateAchievements(totalSolutions, totalLikes, successRate, streakDays, user);

  return {
    // Core metrics
    totalSolutions,
    totalLikes,
    totalDislikes,
    successRate,
    avgResponseTime,
    totalTimeSpent,
    streakDays,

    // Detailed analytics
    topSubreddits,
    topTemplates,
    dailyActivity,
    recentActivity: recentEvents.length,

    // Achievements
    achievements,

    // Metadata
    lastActiveDate: events.length > 0 ? events[0].created_at : user.lastLoginAt,
    memberSince: user.createdAt,
    timeRange
  };
}

/**
 * Calculate activity streak days
 */
function calculateStreakDays(events) {
  if (events.length === 0) return 0;

  const dates = [...new Set(events.map(e =>
    new Date(e.created_at).toISOString().split('T')[0]
  ))].sort().reverse();

  let streak = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 0; i < dates.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedDateStr = expectedDate.toISOString().split('T')[0];

    if (dates[i] === expectedDateStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Generate achievements based on user activity
 */
function generateAchievements(totalSolutions, totalLikes, successRate, streakDays, user) {
  const achievements = [];

  // Solution milestones
  if (totalSolutions >= 1) achievements.push('First Solution');
  if (totalSolutions >= 10) achievements.push('Problem Solver');
  if (totalSolutions >= 50) achievements.push('Solution Expert');
  if (totalSolutions >= 100) achievements.push('Solution Master');

  // Like milestones
  if (totalLikes >= 1) achievements.push('First Like');
  if (totalLikes >= 10) achievements.push('Well Liked');
  if (totalLikes >= 50) achievements.push('Community Favorite');

  // Success rate achievements
  if (successRate >= 80 && totalSolutions >= 5) achievements.push('High Success Rate');
  if (successRate >= 90 && totalSolutions >= 10) achievements.push('Excellence');

  // Streak achievements
  if (streakDays >= 3) achievements.push('3-Day Streak');
  if (streakDays >= 7) achievements.push('Week Warrior');
  if (streakDays >= 30) achievements.push('Monthly Master');

  // Role-based achievements
  if (user.role === 'admin') achievements.push('Administrator');
  if (user.role === 'moderator') achievements.push('Moderator');

  // Time-based achievements
  const accountAge = Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
  if (accountAge >= 30) achievements.push('Veteran Member');
  if (accountAge >= 365) achievements.push('Annual Member');

  return achievements;
}

/**
 * PUT /api/users/stats
 * Update current user's statistics (internal use)
 */
router.put('/stats', authenticate, async (req, res) => {
  try {
    const updatedUser = await userRepository.updateStats(req.user.id, req.body);

    res.json({
      success: true,
      message: 'Statistics updated successfully',
      data: updatedUser.stats
    });

  } catch (error) {
    console.error('❌ Error updating stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update statistics'
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID (public profile)
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await userRepository.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('❌ Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    
    const filters = {};
    if (search) filters.search = search;
    if (role) filters.role = role;
    if (status) filters.isActive = status === 'active';

    const users = await userRepository.findAll(filters);
    
    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        users: paginatedUsers.map(user => user.getPublicProfile()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length,
          pages: Math.ceil(users.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (admin only)
 */
router.put('/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const updatedUser = await userRepository.update(req.params.id, { role });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ User role updated: ${updatedUser.username} -> ${role}`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

/**
 * PUT /api/users/:id/status
 * Update user status (admin only)
 */
router.put('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const updatedUser = await userRepository.update(req.params.id, { isActive });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ User status updated: ${updatedUser.username} -> ${isActive ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: {
        user: updatedUser.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await userRepository.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    await userRepository.delete(req.params.id);

    console.log(`✅ User deleted: ${user.username}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

/**
 * POST /api/users/stats/demo
 * Add demo statistics for testing (development only)
 */
router.post('/stats/demo', authenticate, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Demo stats not available in production'
      });
    }

    // Generate some demo stats
    const demoStats = {
      totalSolutions: Math.floor(Math.random() * 50) + 10, // 10-60 solutions
      totalLikes: Math.floor(Math.random() * 30) + 5,      // 5-35 likes
      totalDislikes: Math.floor(Math.random() * 5),        // 0-5 dislikes
      successRate: Math.floor(Math.random() * 40) + 60,    // 60-100%
      avgResponseTime: Math.floor(Math.random() * 3) + 1,  // 1-4 seconds
      totalTimeSpent: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
      streakDays: Math.floor(Math.random() * 15) + 1,      // 1-15 days
      lastActiveDate: new Date().toISOString(),
      achievements: ['First Solution', 'Problem Solver', 'Helpful Member', 'Rising Star']
    };

    const updatedUser = await userRepository.updateStats(req.user.id, demoStats);

    console.log(`🎯 Added demo stats for user ${req.user.username}:`, demoStats);

    res.json({
      success: true,
      message: 'Demo statistics added successfully',
      data: updatedUser.stats
    });

  } catch (error) {
    console.error('❌ Error adding demo stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add demo statistics'
    });
  }
});

module.exports = router;
