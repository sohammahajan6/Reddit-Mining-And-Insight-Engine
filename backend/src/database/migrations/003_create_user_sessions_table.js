/**
 * Create user_sessions table migration
 */

exports.up = function(knex) {
  return knex.schema.createTable('user_sessions', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // User reference
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Session information
    table.string('session_token', 255).notNullable().unique();
    table.string('refresh_token', 255).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('refresh_expires_at').notNullable();
    
    // Session metadata
    table.string('ip_address', 45);
    table.text('user_agent');
    table.string('device_type', 50); // mobile, desktop, tablet
    table.string('browser', 100);
    table.string('os', 100);
    table.string('location', 100); // City, Country
    
    // Session status
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_activity_at').defaultTo(knex.fn.now());
    table.enum('logout_reason', ['user_logout', 'token_expired', 'admin_revoked', 'security_breach']);
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['session_token']);
    table.index(['refresh_token']);
    table.index(['expires_at']);
    table.index(['is_active']);
    table.index(['last_activity_at']);
    
    // Composite indexes
    table.index(['user_id', 'is_active']);
    table.index(['user_id', 'last_activity_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_sessions');
};
