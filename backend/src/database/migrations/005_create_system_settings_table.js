/**
 * Create system_settings table migration
 */

exports.up = function(knex) {
  return knex.schema.createTable('system_settings', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Setting identification
    table.string('key', 100).notNullable().unique();
    table.string('category', 50).notNullable(); // system, rateLimit, moderation, analytics, notifications
    table.string('name', 255).notNullable();
    table.text('description');
    
    // Setting value and metadata
    table.text('value').notNullable();
    table.enum('value_type', ['string', 'number', 'boolean', 'json', 'array']).defaultTo('string');
    table.text('default_value');
    
    // Validation and constraints
    table.text('validation_rules'); // JSON string with validation rules
    table.boolean('is_required').defaultTo(false);
    table.boolean('is_sensitive').defaultTo(false); // For passwords, API keys, etc.
    
    // Access control
    table.enum('access_level', ['public', 'user', 'moderator', 'admin']).defaultTo('admin');
    table.boolean('is_readonly').defaultTo(false);
    
    // UI metadata
    table.string('ui_component', 50); // input, textarea, select, checkbox, etc.
    table.jsonb('ui_options').defaultTo('{}'); // Component-specific options
    table.integer('sort_order').defaultTo(0);
    
    // Change tracking
    table.uuid('last_modified_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('change_reason');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index(['key']);
    table.index(['category']);
    table.index(['access_level']);
    table.index(['is_readonly']);
    
    // Composite indexes
    table.index(['category', 'sort_order']);
    table.index(['access_level', 'category']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('system_settings');
};
