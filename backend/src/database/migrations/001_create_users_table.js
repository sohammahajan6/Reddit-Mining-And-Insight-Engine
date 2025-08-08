/**
 * Create users table migration
 */

exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Authentication fields
    table.string('email', 255).notNullable().unique();
    table.string('username', 50).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    
    // Profile information
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('phone', 20);
    
    // Account status
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    
    // Preferences (stored as JSONB for flexibility)
    table.jsonb('preferences').defaultTo(JSON.stringify({
      theme: 'system',
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
    }));
    
    // Social links (stored as JSONB)
    table.jsonb('social_links').defaultTo('{}');
    
    // Statistics (stored as JSONB for flexibility)
    table.jsonb('stats').defaultTo(JSON.stringify({
      totalSolutions: 0,
      totalLikes: 0,
      totalDislikes: 0,
      successRate: 0,
      avgResponseTime: 0,
      totalTimeSpent: 0,
      streakDays: 0,
      lastActiveDate: null,
      achievements: []
    }));
    
    // Timestamps
    table.timestamps(true, true);
    table.timestamp('last_login_at');
    table.timestamp('deleted_at'); // Soft delete
    
    // Indexes
    table.index(['email']);
    table.index(['username']);
    table.index(['role']);
    table.index(['is_active']);
    table.index(['created_at']);
    table.index(['last_login_at']);
    
    // Composite indexes
    table.index(['role', 'is_active']);
    table.index(['is_active', 'created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
