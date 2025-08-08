/**
 * Create analytics_events table migration
 */

exports.up = function(knex) {
  return knex.schema.createTable('analytics_events', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Event information
    table.enum('event_type', [
      'solution_generated',
      'user_feedback',
      'user_login',
      'user_logout',
      'user_registration',
      'page_view',
      'feature_used'
    ]).notNullable();
    
    // User reference (nullable for anonymous events)
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('session_id', 100);
    
    // Reddit post information
    table.string('subreddit', 100);
    table.string('post_id', 50);
    table.text('post_title');
    
    // Solution information
    table.enum('solution_template', ['general', 'relationship', 'career', 'technical', 'social']);
    table.enum('solution_tone', ['empathetic', 'professional', 'casual', 'direct']);
    table.enum('solution_length', ['short', 'medium', 'detailed']);
    table.integer('solution_word_count');
    table.decimal('generation_time', 8, 3); // Time in seconds with millisecond precision
    
    // User feedback
    table.enum('user_rating', ['like', 'dislike']);
    table.text('feedback_text');
    table.boolean('success');
    
    // Additional event data (flexible JSONB field)
    table.jsonb('event_data').defaultTo('{}');
    
    // Request metadata
    table.string('ip_address', 45); // IPv6 compatible
    table.text('user_agent');
    table.string('referrer', 500);
    
    // Timestamps
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['event_type']);
    table.index(['user_id']);
    table.index(['session_id']);
    table.index(['subreddit']);
    table.index(['created_at']);
    table.index(['success']);
    
    // Composite indexes for common queries
    table.index(['event_type', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['subreddit', 'created_at']);
    table.index(['event_type', 'user_id']);
    table.index(['solution_template', 'success']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('analytics_events');
};
