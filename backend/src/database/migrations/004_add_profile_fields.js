/**
 * Migration to add profile fields back to users table
 * These fields are optional and can be updated in profile section
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Add profile fields that can be updated later
    table.text('bio');
    table.string('location', 100);
    table.string('website', 255);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Remove profile fields
    table.dropColumn('bio');
    table.dropColumn('location');
    table.dropColumn('website');
  });
};
