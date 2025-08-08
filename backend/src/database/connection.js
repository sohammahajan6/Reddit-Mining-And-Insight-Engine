const { Pool } = require('pg');
const { db, testConnection, healthCheck } = require('../config/database');

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Initialize database connection with retry logic
   */
  async initialize() {
    console.log('🔌 Initializing database connection...');
    
    while (this.connectionAttempts < this.maxRetries) {
      try {
        // Test connection using Knex
        const isConnected = await testConnection();
        
        if (isConnected) {
          this.isConnected = true;
          console.log('✅ Database connection established');
          
          // Setup connection event handlers
          this.setupEventHandlers();
          
          return true;
        }
        
        throw new Error('Connection test failed');
        
      } catch (error) {
        this.connectionAttempts++;
        console.error(`❌ Database connection attempt ${this.connectionAttempts} failed:`, error.message);
        
        if (this.connectionAttempts >= this.maxRetries) {
          console.error('💥 Max database connection retries exceeded');
          throw new Error(`Failed to connect to database after ${this.maxRetries} attempts`);
        }
        
        console.log(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
        await this.sleep(this.retryDelay);
      }
    }
  }

  /**
   * Setup database event handlers
   */
  setupEventHandlers() {
    // Handle process termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGUSR2', this.gracefulShutdown.bind(this)); // nodemon restart
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      this.gracefulShutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown() {
    console.log('🔄 Gracefully shutting down database connection...');
    
    try {
      if (this.isConnected) {
        await db.destroy();
        this.isConnected = false;
        console.log('✅ Database connection closed');
      }
    } catch (error) {
      console.error('❌ Error during database shutdown:', error.message);
    }
    
    process.exit(0);
  }

  /**
   * Get database health status
   */
  async getHealth() {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          message: 'Database not connected'
        };
      }
      
      return await healthCheck();
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Execute raw query with error handling
   */
  async query(text, params = []) {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }
      
      const result = await db.raw(text, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Database query error:', error.message);
      throw error;
    }
  }

  /**
   * Execute transaction
   */
  async transaction(callback) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    
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

  /**
   * Check if database is connected
   */
  isHealthy() {
    return this.isConnected;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay
    };
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

// Connection monitoring
setInterval(async () => {
  if (dbConnection.isConnected) {
    try {
      await db.raw('SELECT 1');
    } catch (error) {
      console.error('❌ Database connection lost:', error.message);
      dbConnection.isConnected = false;
      
      // Attempt to reconnect
      try {
        await dbConnection.initialize();
      } catch (reconnectError) {
        console.error('❌ Failed to reconnect to database:', reconnectError.message);
      }
    }
  }
}, 30000); // Check every 30 seconds

module.exports = {
  dbConnection,
  db
};
