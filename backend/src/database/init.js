const UserRepository = require('../repositories/UserRepository');
const User = require('../models/User');

/**
 * Initialize database with default admin user and sample data
 */
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database...');
    
    const userRepository = new UserRepository();
    await userRepository.initialize();

    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@redditai.com';
    const existingAdmin = await userRepository.findByEmail(adminEmail);

    if (!existingAdmin) {
      console.log('👑 Creating default admin user...');
      
      // Create default admin user
      const adminUser = await userRepository.create({
        email: adminEmail,
        username: 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        emailVerified: true,
        preferences: {
          theme: 'system',
          defaultTemplate: 'general',
          defaultTone: 'professional',
          defaultLength: 'medium',
          enableFollowupQuestions: true,
          emailNotifications: true,
          pushNotifications: false,
          analyticsOptIn: true,
          favoriteSubreddits: ['relationship_advice', 'careerquestions', 'personalfinance'],
          language: 'en',
          timezone: 'UTC'
        },
        stats: {
          totalSolutions: 0,
          totalLikes: 0,
          totalDislikes: 0,
          successRate: 0,
          avgResponseTime: 0,
          totalTimeSpent: 0,
          streakDays: 0,
          lastActiveDate: null,
          achievements: ['admin_access', 'system_creator']
        }
      });

      console.log(`✅ Admin user created: ${adminUser.email}`);
    } else {
      console.log('👑 Admin user already exists');
    }



      // Create sample regular users
      const sampleUsers = [
        {
          email: 'john.doe@example.com',
          username: 'john_doe',
          password: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user',
          bio: 'Love getting advice on relationships and career decisions.',
          location: 'New York, NY',
          stats: {
            totalSolutions: 25,
            totalLikes: 20,
            totalDislikes: 5,
            successRate: 80.0,
            avgResponseTime: 3.2,
            totalTimeSpent: 78,
            streakDays: 3,
            lastActiveDate: new Date().toISOString(),
            achievements: ['first_solution', 'helpful_feedback']
          }
        },
        {
          email: 'jane.smith@example.com',
          username: 'jane_smith',
          password: 'user123',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'user',
          bio: 'Tech professional seeking career and technical advice.',
          location: 'San Francisco, CA',
          website: 'https://janesmith.dev',
          stats: {
            totalSolutions: 45,
            totalLikes: 38,
            totalDislikes: 7,
            successRate: 84.4,
            avgResponseTime: 2.8,
            totalTimeSpent: 125,
            streakDays: 7,
            lastActiveDate: new Date().toISOString(),
            achievements: ['first_solution', 'helpful_feedback', 'power_user', 'streak_master']
          }
        },
        {
          email: 'mike.wilson@example.com',
          username: 'mike_wilson',
          password: 'user123',
          firstName: 'Mike',
          lastName: 'Wilson',
          role: 'user',
          bio: 'Student looking for advice on various life topics.',
          location: 'Austin, TX',
          stats: {
            totalSolutions: 8,
            totalLikes: 6,
            totalDislikes: 2,
            successRate: 75.0,
            avgResponseTime: 4.1,
            totalTimeSpent: 32,
            streakDays: 1,
            lastActiveDate: new Date().toISOString(),
            achievements: ['first_solution']
          }
        }
      ];

      for (const userData of sampleUsers) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (!existingUser) {
          await userRepository.create(userData);
          console.log(`✅ Sample user created: ${userData.email}`);
        }
      }
    }

    console.log('✅ Database initialization complete');
    return true;

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

/**
 * Create default system settings
 */
async function createSystemSettings() {
  // This would typically be stored in a separate settings collection/sheet
  const defaultSettings = {
    system: {
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: false,
      maxSolutionsPerDay: 50,
      maxSolutionsPerHour: 10
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      burstLimit: 150
    },
    moderation: {
      autoSpamDetection: true,
      filterInappropriateContent: true,
      requireApprovalForNewUsers: false,
      flaggedContentThreshold: 3
    },
    analytics: {
      retentionDays: 90,
      anonymizeAfterDays: 365,
      enableDetailedTracking: true
    },
    notifications: {
      emailEnabled: true,
      pushEnabled: false,
      slackWebhook: process.env.SLACK_WEBHOOK_URL || null
    }
  };

  console.log('⚙️ System settings initialized');
  return defaultSettings;
}

/**
 * Seed achievement definitions
 */
function getAchievementDefinitions() {
  return {
    first_solution: {
      name: 'First Solution',
      description: 'Generated your first AI solution',
      icon: '🎯',
      condition: 'totalSolutions >= 1'
    },
    helpful_feedback: {
      name: 'Helpful Feedback',
      description: 'Received 5 likes on your solutions',
      icon: '👍',
      condition: 'totalLikes >= 5'
    },
    power_user: {
      name: 'Power User',
      description: 'Generated 25 solutions',
      icon: '⚡',
      condition: 'totalSolutions >= 25'
    },
    streak_master: {
      name: 'Streak Master',
      description: 'Used the app for 7 consecutive days',
      icon: '🔥',
      condition: 'streakDays >= 7'
    },
    quality_contributor: {
      name: 'Quality Contributor',
      description: 'Maintained 90% success rate with 20+ solutions',
      icon: '⭐',
      condition: 'successRate >= 90 && totalSolutions >= 20'
    },
    admin_access: {
      name: 'Administrator',
      description: 'System administrator privileges',
      icon: '👑',
      condition: 'role === "admin"'
    },

    system_creator: {
      name: 'System Creator',
      description: 'Original system administrator',
      icon: '🏗️',
      condition: 'special'
    }
  };
}

/**
 * Check and award achievements for a user
 */
function checkAchievements(user) {
  const achievements = getAchievementDefinitions();
  const newAchievements = [];

  for (const [key, achievement] of Object.entries(achievements)) {
    if (!user.stats.achievements.includes(key)) {
      let earned = false;

      try {
        // Simple condition evaluation
        if (achievement.condition === 'special') {
          // Special achievements are manually awarded
          continue;
        }

        // Replace variables in condition
        let condition = achievement.condition
          .replace(/totalSolutions/g, user.stats.totalSolutions)
          .replace(/totalLikes/g, user.stats.totalLikes)
          .replace(/successRate/g, user.stats.successRate)
          .replace(/streakDays/g, user.stats.streakDays)
          .replace(/role/g, `"${user.role}"`);

        earned = eval(condition);
      } catch (error) {
        console.error(`Error evaluating achievement condition for ${key}:`, error);
      }

      if (earned) {
        newAchievements.push(key);
        user.addAchievement(key);
      }
    }
  }

  return newAchievements;
}

module.exports = {
  initializeDatabase,
  createSystemSettings,
  getAchievementDefinitions,
  checkAchievements
};
