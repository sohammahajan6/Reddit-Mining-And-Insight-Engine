/**
 * Create bookmarks table migration
 */

exports.up = function(knex) {
  return knex.schema.createTable('bookmarks', function(table) {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // User reference
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Bookmark information
    table.string('title', 255).notNullable();
    table.text('description');
    table.enum('type', ['solution', 'post', 'external']).defaultTo('solution');
    
    // Reddit post information (if applicable)
    table.string('subreddit', 100);
    table.string('post_id', 50);
    table.text('post_title');
    table.text('post_url');
    
    // Solution information (if applicable)
    table.text('solution_content');
    table.enum('solution_template', ['general', 'relationship', 'career', 'technical', 'social']);
    table.enum('solution_tone', ['empathetic', 'professional', 'casual', 'direct']);
    table.enum('solution_length', ['short', 'medium', 'detailed']);
    
    // External link (if applicable)
    table.string('external_url', 500);
    
    // Organization
    table.string('category', 100); // User-defined categories
    table.jsonb('tags').defaultTo('[]'); // Array of tags
    table.integer('sort_order').defaultTo(0);
    
    // Metadata
    table.boolean('is_favorite').defaultTo(false);
    table.boolean('is_private').defaultTo(false);
    table.text('notes'); // User's personal notes
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['type']);
    table.index(['subreddit']);
    table.index(['category']);
    table.index(['is_favorite']);
    table.index(['created_at']);
    
    // Composite indexes
    table.index(['user_id', 'type']);
    table.index(['user_id', 'category']);
    table.index(['user_id', 'is_favorite']);
    table.index(['user_id', 'created_at']);
    
    // Unique constraint to prevent duplicate bookmarks
    table.unique(['user_id', 'post_id', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('bookmarks');
};
