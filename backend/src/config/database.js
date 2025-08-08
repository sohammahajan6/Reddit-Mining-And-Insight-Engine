const knex = require('knex');
const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'reddit_ai_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },
  
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: 5,
      max: 20,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME_TEST || 'reddit_ai_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: './src/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  }
};

// Get environment
const environment = process.env.NODE_ENV || 'development';
const config = dbConfig[environment];

// Create Knex instance
const db = knex(config);

// Test database connection
async function testConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Close database connection
async function closeConnection() {
  try {
    await db.destroy();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message);
  }
}

// Database health check
async function healthCheck() {
  try {
    const result = await db.raw('SELECT NOW() as current_time, version() as version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].version,
      environment
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      environment
    };
  }
}

// Get database statistics
async function getStats() {
  try {
    const [
      userCount,
      analyticsCount,
      sessionCount
    ] = await Promise.all([
      db('users').count('id as count').first(),
      db('analytics_events').count('id as count').first(),
      db('user_sessions').count('id as count').first()
    ]);

    return {
      users: parseInt(userCount.count),
      analyticsEvents: parseInt(analyticsCount.count),
      activeSessions: parseInt(sessionCount.count),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return null;
  }
}

// Transaction helper
async function transaction(callback) {
  const trx = await db.transaction();
  try {
    const result = await callback(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

// Raw query helper with logging
async function query(sql, params = []) {
  try {
    console.log('🔍 Executing query:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
    const result = await db.raw(sql, params);
    return result.rows;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
}

// Batch insert helper
async function batchInsert(table, data, chunkSize = 100) {
  try {
    const result = await db.batchInsert(table, data, chunkSize);
    console.log(`✅ Batch inserted ${data.length} records into ${table}`);
    return result;
  } catch (error) {
    console.error(`❌ Batch insert error for ${table}:`, error.message);
    throw error;
  }
}

// Migration helpers
async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');
    const [batchNo, log] = await db.migrate.latest();
    
    if (log.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Ran ${log.length} migrations:`);
      log.forEach(migration => console.log(`  - ${migration}`));
    }
    
    return { batchNo, migrations: log };
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  }
}

async function rollbackMigration() {
  try {
    console.log('⏪ Rolling back last migration...');
    const [batchNo, log] = await db.migrate.rollback();
    
    if (log.length === 0) {
      console.log('ℹ️ No migrations to rollback');
    } else {
      console.log(`✅ Rolled back ${log.length} migrations:`);
      log.forEach(migration => console.log(`  - ${migration}`));
    }
    
    return { batchNo, migrations: log };
  } catch (error) {
    console.error('❌ Rollback error:', error.message);
    throw error;
  }
}

// Seed helpers
async function runSeeds() {
  try {
    console.log('🌱 Running database seeds...');
    const log = await db.seed.run();
    console.log(`✅ Ran ${log.length} seed files:`);
    log.forEach(seed => console.log(`  - ${seed}`));
    return log;
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    throw error;
  }
}

// Export database instance and helpers
module.exports = {
  db,
  config,
  testConnection,
  closeConnection,
  healthCheck,
  getStats,
  transaction,
  query,
  batchInsert,
  runMigrations,
  rollbackMigration,
  runSeeds
};
