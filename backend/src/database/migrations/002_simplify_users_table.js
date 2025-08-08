/**
 * Migration to simplify users table structure
 * Remove unnecessary fields and add phone field
 */

exports.up = async function(knex) {
  // Check which columns exist
  const hasPhoneColumn = await knex.schema.hasColumn('users', 'phone');
  const hasBioColumn = await knex.schema.hasColumn('users', 'bio');
  const hasLocationColumn = await knex.schema.hasColumn('users', 'location');
  const hasWebsiteColumn = await knex.schema.hasColumn('users', 'website');
  const hasAvatarColumn = await knex.schema.hasColumn('users', 'avatar_url');

  return knex.schema.alterTable('users', function(table) {
    // Add phone field if it doesn't exist
    if (!hasPhoneColumn) {
      table.string('phone', 20);
    }

    // Make first_name and last_name required
    table.string('first_name', 100).notNullable().alter();
    table.string('last_name', 100).notNullable().alter();

    // Drop unnecessary fields if they exist
    if (hasBioColumn) table.dropColumn('bio');
    if (hasLocationColumn) table.dropColumn('location');
    if (hasWebsiteColumn) table.dropColumn('website');
    if (hasAvatarColumn) table.dropColumn('avatar_url');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    // Add back the dropped fields
    table.text('bio');
    table.string('location', 100);
    table.string('website', 255);
    table.string('avatar_url', 500);
    
    // Make first_name and last_name optional again
    table.string('first_name', 100).nullable().alter();
    table.string('last_name', 100).nullable().alter();
    
    // Drop phone field
    table.dropColumn('phone');
  });
};
