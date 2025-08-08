/**
 * Migration to add avatar_url field to users table
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Add avatar URL field
    table.string('avatar_url', 500);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Remove avatar URL field
    table.dropColumn('avatar_url');
  });
};
