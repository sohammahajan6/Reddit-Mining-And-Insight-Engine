const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Create default admin user and system settings
 */
exports.seed = async function(knex) {
  try {
    console.log('🌱 Seeding admin user and system settings...');

    // Check if admin user already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@redditai.com';
    const existingAdmin = await knex('users')
      .where('email', adminEmail)
      .first();

    if (!existingAdmin) {
      console.log('👑 Creating default admin user...');
      
      // Hash admin password
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      // Create admin user
      const adminId = uuidv4();
      await knex('users').insert({
        id: adminId,
        email: adminEmail,
        username: 'admin',
        password_hash: hashedPassword,
        first_name: 'System',
        last_name: 'Administrator',
        role: 'admin',
        is_active: true,
        email_verified: true,
        preferences: JSON.stringify({
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
        }),
        social_links: JSON.stringify({}),
        stats: JSON.stringify({
          totalSolutions: 0,
          totalLikes: 0,
          totalDislikes: 0,
          successRate: 0,
          avgResponseTime: 0,
          totalTimeSpent: 0,
          streakDays: 0,
          lastActiveDate: null,
          achievements: ['admin_access', 'system_creator']
        }),
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      console.log('👑 Admin user already exists');
    }

    // Create system settings
    const systemSettings = [
      {
        id: uuidv4(),
        key: 'maintenance_mode',
        category: 'system',
        name: 'Maintenance Mode',
        description: 'Enable maintenance mode to prevent user access',
        value: 'false',
        value_type: 'boolean',
        default_value: 'false',
        access_level: 'admin',
        ui_component: 'checkbox',
        sort_order: 1
      },
      {
        id: uuidv4(),
        key: 'registration_enabled',
        category: 'system',
        name: 'Registration Enabled',
        description: 'Allow new user registrations',
        value: 'true',
        value_type: 'boolean',
        default_value: 'true',
        access_level: 'admin',
        ui_component: 'checkbox',
        sort_order: 2
      },
      {
        id: uuidv4(),
        key: 'email_verification_required',
        category: 'system',
        name: 'Email Verification Required',
        description: 'Require email verification for new accounts',
        value: 'false',
        value_type: 'boolean',
        default_value: 'false',
        access_level: 'admin',
        ui_component: 'checkbox',
        sort_order: 3
      },
      {
        id: uuidv4(),
        key: 'max_solutions_per_day',
        category: 'system',
        name: 'Max Solutions Per Day',
        description: 'Maximum solutions a user can generate per day',
        value: '50',
        value_type: 'number',
        default_value: '50',
        access_level: 'admin',
        ui_component: 'input',
        sort_order: 4
      },
      {
        id: uuidv4(),
        key: 'rate_limit_window_ms',
        category: 'rateLimit',
        name: 'Rate Limit Window (ms)',
        description: 'Time window for rate limiting in milliseconds',
        value: '900000',
        value_type: 'number',
        default_value: '900000',
        access_level: 'admin',
        ui_component: 'input',
        sort_order: 1
      },
      {
        id: uuidv4(),
        key: 'rate_limit_max_requests',
        category: 'rateLimit',
        name: 'Max Requests Per Window',
        description: 'Maximum requests allowed per rate limit window',
        value: '100',
        value_type: 'number',
        default_value: '100',
        access_level: 'admin',
        ui_component: 'input',
        sort_order: 2
      },
      {
        id: uuidv4(),
        key: 'auto_spam_detection',
        category: 'moderation',
        name: 'Auto Spam Detection',
        description: 'Enable automatic spam detection',
        value: 'true',
        value_type: 'boolean',
        default_value: 'true',
        access_level: 'admin',
        ui_component: 'checkbox',
        sort_order: 1
      },
      {
        id: uuidv4(),
        key: 'filter_inappropriate_content',
        category: 'moderation',
        name: 'Filter Inappropriate Content',
        description: 'Enable content filtering for inappropriate material',
        value: 'true',
        value_type: 'boolean',
        default_value: 'true',
        access_level: 'admin',
        ui_component: 'checkbox',
        sort_order: 2
      },
      {
        id: uuidv4(),
        key: 'analytics_retention_days',
        category: 'analytics',
        name: 'Analytics Retention (Days)',
        description: 'Number of days to retain analytics data',
        value: '90',
        value_type: 'number',
        default_value: '90',
        access_level: 'admin',
        ui_component: 'input',
        sort_order: 1
      },
      {
        id: uuidv4(),
        key: 'enable_detailed_tracking',
        category: 'analytics',
        name: 'Enable Detailed Tracking',
        description: 'Enable detailed user behavior tracking',
        value: 'true',
        value_type: 'boolean',
        default_value: 'true',
        access_level: 'admin',
        ui_component: 'checkbox',
        sort_order: 2
      }
    ];

    // Insert system settings (only if they don't exist)
    for (const setting of systemSettings) {
      const existing = await knex('system_settings')
        .where('key', setting.key)
        .first();

      if (!existing) {
        await knex('system_settings').insert({
          ...setting,
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log(`✅ Created system setting: ${setting.key}`);
      }
    }

    console.log('✅ Admin user and system settings seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
};
