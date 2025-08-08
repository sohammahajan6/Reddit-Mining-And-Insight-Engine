/**
 * Migration to change avatar_url column to text type for base64 storage
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Change avatar_url to text to support base64 data
    table.text('avatar_url').alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Revert back to string
    table.string('avatar_url', 500).alter();
  });
};
