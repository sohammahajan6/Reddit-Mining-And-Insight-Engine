#!/usr/bin/env node

/**
 * Database migration utility
 */

const { runMigrations, rollbackMigration, db } = require('../config/database');

async function migrate() {
  try {
    console.log('🚀 Starting database migration...');
    
    const result = await runMigrations();
    
    if (result.migrations.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Successfully ran ${result.migrations.length} migrations`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function rollback() {
  try {
    console.log('⏪ Rolling back last migration...');
    
    const result = await rollbackMigration();
    
    if (result.migrations.length === 0) {
      console.log('ℹ️ No migrations to rollback');
    } else {
      console.log(`✅ Successfully rolled back ${result.migrations.length} migrations`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

async function status() {
  try {
    console.log('📊 Checking migration status...');
    
    // Get completed migrations
    const completed = await db.migrate.currentVersion();
    console.log(`Current migration version: ${completed}`);
    
    // Get pending migrations
    const [, pending] = await db.migrate.list();
    
    if (pending.length === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log(`⏳ ${pending.length} pending migrations:`);
      pending.forEach(migration => console.log(`  - ${migration}`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Status check failed:', error.message);
    process.exit(1);
  }
}

async function reset() {
  try {
    console.log('🔄 Resetting database...');
    
    // Rollback all migrations
    await db.migrate.rollback({}, true);
    console.log('✅ All migrations rolled back');
    
    // Run all migrations
    await runMigrations();
    console.log('✅ All migrations re-applied');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'up':
  case 'migrate':
    migrate();
    break;
    
  case 'down':
  case 'rollback':
    rollback();
    break;
    
  case 'status':
    status();
    break;
    
  case 'reset':
    reset();
    break;
    
  default:
    console.log(`
Database Migration Utility

Usage: node migrate.js <command>

Commands:
  up, migrate    Run pending migrations
  down, rollback Rollback last migration
  status         Show migration status
  reset          Rollback all and re-run migrations

Examples:
  node migrate.js up
  node migrate.js status
  node migrate.js rollback
    `);
    process.exit(1);
}
