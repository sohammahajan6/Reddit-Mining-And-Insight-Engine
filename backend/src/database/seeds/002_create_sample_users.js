const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Create sample users for development
 */
exports.seed = async function(knex) {
  // Only run in development environment
  if (process.env.NODE_ENV !== 'development') {
    console.log('⏭️ Skipping sample users seed (not in development mode)');
    return;
  }

  try {
    console.log('🌱 Seeding sample users for development...');

    const sampleUsers = [
      {
        email: 'john.doe@example.com',
        username: 'john_doe',
        password: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        phone: '+1-555-0101',
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
        phone: '+1-555-0102',
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
      },
      {
        email: 'sarah.johnson@example.com',
        username: 'sarah_j',
        password: 'user123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'user',
        stats: {
          totalSolutions: 32,
          totalLikes: 28,
          totalDislikes: 4,
          successRate: 87.5,
          avgResponseTime: 2.9,
          totalTimeSpent: 95,
          streakDays: 4,
          lastActiveDate: new Date().toISOString(),
          achievements: ['first_solution', 'helpful_feedback', 'power_user']
        }
      }
    ];

    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await knex('users')
        .where('email', userData.email)
        .first();

      if (!existingUser) {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Prepare user data for database
        const userRecord = {
          id: uuidv4(),
          email: userData.email,
          username: userData.username,
          password_hash: hashedPassword,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          role: userData.role,
          is_active: true,
          email_verified: true,
          preferences: JSON.stringify({
            theme: 'system',
            defaultTemplate: 'general',
            defaultTone: 'empathetic',
            defaultLength: 'medium',
            enableFollowupQuestions: false,
            emailNotifications: true,
            pushNotifications: false,
            analyticsOptIn: true,
            favoriteSubreddits: ['advice', 'askreddit'],
            language: 'en',
            timezone: 'UTC'
          }),
          stats: JSON.stringify(userData.stats),
          created_at: new Date(),
          updated_at: new Date()
        };

        await knex('users').insert(userRecord);
        console.log(`✅ Created sample user: ${userData.email}`);
      } else {
        console.log(`⏭️ Sample user already exists: ${userData.email}`);
      }
    }

    console.log('✅ Sample users seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding sample users:', error);
    throw error;
  }
};
