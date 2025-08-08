const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { db } = require('../database/connection');
const UserRepository = require('../repositories/UserRepository');
const userRepository = new UserRepository();

/**
 * GET /api/admin/stats
 * Get system-wide statistics for admin dashboard
 */
router.get('/stats', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    console.log('📊 Fetching admin system stats...');

    // Get total users count
    const totalUsersResult = await db('users')
      .count('* as count')
      .where('deleted_at', null)
      .first();
    const totalUsers = parseInt(totalUsersResult.count);

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsersResult = await db('users')
      .count('* as count')
      .where('deleted_at', null)
      .where('is_active', true)
      .where('last_login_at', '>=', thirtyDaysAgo)
      .first();
    const activeUsers = parseInt(activeUsersResult.count);

    // Get total solutions from analytics events
    const totalSolutionsResult = await db('analytics_events')
      .count('* as count')
      .where('event_type', 'solution_generated')
      .first();
    const totalSolutions = parseInt(totalSolutionsResult.count);

    // Calculate average success rate
    const feedbackEvents = await db('analytics_events')
      .where('event_type', 'user_feedback')
      .select('success');
    
    const totalFeedback = feedbackEvents.length;
    const successfulFeedback = feedbackEvents.filter(e => e.success).length;
    const avgSuccessRate = totalFeedback > 0 ? 
      parseFloat(((successfulFeedback / totalFeedback) * 100).toFixed(1)) : 0;

    // Calculate average response time
    const responseTimeEvents = await db('analytics_events')
      .where('event_type', 'solution_generated')
      .whereNotNull('generation_time')
      .select('generation_time');
    
    const avgResponseTime = responseTimeEvents.length > 0 ?
      parseFloat((responseTimeEvents.reduce((sum, e) => sum + parseFloat(e.generation_time), 0) / responseTimeEvents.length).toFixed(2)) : 0;

    // Get daily active users (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const dailyActiveUsersResult = await db('users')
      .count('* as count')
      .where('deleted_at', null)
      .where('is_active', true)
      .where('last_login_at', '>=', oneDayAgo)
      .first();
    const dailyActiveUsers = parseInt(dailyActiveUsersResult.count);

    // Get recent activity counts
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const newRegistrationsToday = await db('users')
      .count('* as count')
      .where('created_at', '>=', todayStart)
      .first();

    const solutionsToday = await db('analytics_events')
      .count('* as count')
      .where('event_type', 'solution_generated')
      .where('created_at', '>=', todayStart)
      .first();

    // Get system health metrics
    const errorEventsToday = await db('analytics_events')
      .count('* as count')
      .where('success', false)
      .where('created_at', '>=', todayStart)
      .first();

    // Calculate system uptime (based on when server started)
    const serverStartTime = process.uptime(); // in seconds
    const uptimeDays = Math.floor(serverStartTime / (24 * 60 * 60));
    const uptimeHours = Math.floor((serverStartTime % (24 * 60 * 60)) / (60 * 60));
    const uptimeMinutes = Math.floor((serverStartTime % (60 * 60)) / 60);
    const systemUptime = `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`;

    // Get total feedback events for quality metrics
    const totalFeedbackToday = await db('analytics_events')
      .count('* as count')
      .where('event_type', 'user_feedback')
      .where('created_at', '>=', todayStart)
      .first();

    const systemStats = {
      totalUsers,
      activeUsers,
      totalSolutions,
      avgSuccessRate,
      avgResponseTime,
      dailyActiveUsers,
      systemUptime,
      systemHealth: {
        status: 'healthy',
        errorRate: totalSolutions > 0 ?
          parseFloat(((parseInt(errorEventsToday.count) / totalSolutions) * 100).toFixed(2)) : 0,
        responseTime: avgResponseTime
      },
      recentActivity: {
        newRegistrationsToday: parseInt(newRegistrationsToday.count),
        solutionsToday: parseInt(solutionsToday.count),
        feedbackToday: parseInt(totalFeedbackToday.count),
        errorEventsToday: parseInt(errorEventsToday.count)
      }
    };

    console.log('✅ Admin stats fetched successfully');

    res.json({
      success: true,
      data: systemStats,
      metadata: {
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system statistics'
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users for admin management
 */
router.get('/users', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    console.log(`📊 Fetching users (page ${page}, limit ${limit})`);

    let query = db('users')
      .select([
        'id', 'username', 'email', 'first_name', 'last_name', 
        'role', 'is_active', 'created_at', 'last_login_at', 'stats'
      ])
      .where('deleted_at', null);

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('username', 'ilike', `%${search}%`)
            .orWhere('email', 'ilike', `%${search}%`)
            .orWhere('first_name', 'ilike', `%${search}%`)
            .orWhere('last_name', 'ilike', `%${search}%`);
      });
    }

    if (role) {
      query = query.where('role', role);
    }

    if (status === 'active') {
      query = query.where('is_active', true);
    } else if (status === 'inactive') {
      query = query.where('is_active', false);
    }

    // Get total count for pagination (separate query)
    let countQuery = db('users').where('deleted_at', null);

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.where(function() {
        this.where('username', 'ilike', `%${search}%`)
            .orWhere('email', 'ilike', `%${search}%`)
            .orWhere('first_name', 'ilike', `%${search}%`)
            .orWhere('last_name', 'ilike', `%${search}%`);
      });
    }

    if (role) {
      countQuery = countQuery.where('role', role);
    }

    if (status === 'active') {
      countQuery = countQuery.where('is_active', true);
    } else if (status === 'inactive') {
      countQuery = countQuery.where('is_active', false);
    }

    const totalResult = await countQuery.count('* as count').first();
    const total = parseInt(totalResult.count);

    // Get paginated results
    const users = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // Format user data
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      stats: user.stats || {
        totalSolutions: 0,
        successRate: 0
      }
    }));

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * GET /api/admin/database/stats
 * Get database statistics
 */
router.get('/database/stats', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    console.log('📊 Fetching database stats...');

    // Get basic table information (compatible with all PostgreSQL versions)
    const tableListQuery = `
      SELECT
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
        pg_total_relation_size(quote_ident(table_name)) as size_bytes
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
    `;

    const tableListResult = await db.raw(tableListQuery);
    const tableList = tableListResult.rows;

    // Get row counts for each table individually
    const tables = {};
    for (const table of tableList) {
      try {
        // Get row count for this specific table
        const countResult = await db(table.table_name).count('* as count').first();
        const rowCount = parseInt(countResult.count) || 0;

        tables[table.table_name] = {
          name: table.table_name,
          rows: rowCount,
          size: table.size || '0 bytes',
          sizeBytes: parseInt(table.size_bytes) || 0,
          lastUpdated: new Date().toISOString().split('T')[0], // Use current date as fallback
        };
      } catch (error) {
        console.warn(`⚠️ Could not get stats for table ${table.table_name}:`, error.message);
        // Add table with minimal info if count fails
        tables[table.table_name] = {
          name: table.table_name,
          rows: 0,
          size: table.size || '0 bytes',
          sizeBytes: parseInt(table.size_bytes) || 0,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }
    }

    // Get database size (PostgreSQL specific)
    const dbSizeQuery = `
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    const dbSizeResult = await db.raw(dbSizeQuery);
    const databaseSize = dbSizeResult.rows[0]?.size || 'Unknown';

    // Get connection stats (PostgreSQL specific)
    const connectionQuery = `
      SELECT
        count(*) as total_connections,
        count(*) filter (where state = 'active') as active_connections,
        setting::int as max_connections
      FROM pg_stat_activity, pg_settings
      WHERE pg_settings.name = 'max_connections'
      GROUP BY setting
    `;
    const connectionResult = await db.raw(connectionQuery);
    const connectionStats = connectionResult.rows[0] || {
      total_connections: 0,
      active_connections: 0,
      max_connections: 100
    };

    const dbStats = {
      connectionStatus: 'healthy',
      totalConnections: parseInt(connectionStats.total_connections),
      activeConnections: parseInt(connectionStats.active_connections),
      maxConnections: parseInt(connectionStats.max_connections),
      databaseSize,
      tables: tables,
      tableStats: Object.keys(tables).reduce((acc, tableName) => {
        acc[tableName] = tables[tableName].rows;
        return acc;
      }, {}),
      lastBackup: 'N/A', // Would come from backup service
      backupSize: 'N/A'
    };

    res.json({
      success: true,
      data: dbStats
    });

  } catch (error) {
    console.error('❌ Error fetching database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database statistics'
    });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
router.put('/users/:id/role', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const updatedUser = await userRepository.update(id, { role });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ User role updated: ${updatedUser.username} -> ${role}`);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser.getPublicProfile()
    });

  } catch (error) {
    console.error('❌ Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user active status
 */
router.put('/users/:id/status', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedUser = await userRepository.update(id, { isActive });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ User status updated: ${updatedUser.username} -> ${isActive ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: updatedUser.getPublicProfile()
    });

  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Soft delete user
 */
router.delete('/users/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting deleted_at timestamp
    const deletedUser = await userRepository.update(id, {
      deletedAt: new Date(),
      isActive: false
    });

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ User deleted: ${deletedUser.username}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

module.exports = router;
