const express = require('express');
const Joi = require('joi');
const SheetsClient = require('../clients/sheetsClient');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const sheetsClient = new SheetsClient();

// Validation schemas
const logResponseSchema = Joi.object({
  post: Joi.object({
    id: Joi.string().required(),
    title: Joi.string().required(),
    body: Joi.string().allow(''),
    subreddit: Joi.string().required(),
    url: Joi.string().uri().required(),
    author: Joi.string().optional(),
    score: Joi.number().optional(),
    created: Joi.string().optional(),
    numComments: Joi.number().optional()
  }).required(),
  solution: Joi.string().required(),
  rating: Joi.string().valid('like', 'dislike').required(),
  feedback: Joi.string().max(1000).allow('').optional()
});

/**
 * POST /api/sheets/initialize
 * Initialize the Google Sheets with headers
 */
router.post('/initialize', async (req, res) => {
  try {
    await sheetsClient.initializeSpreadsheet();
    
    res.json({
      success: true,
      message: 'Spreadsheet initialized successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error initializing spreadsheet:', error);
    
    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied to access Google Sheets',
        suggestion: 'Check your Google Sheets API credentials and permissions'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to initialize spreadsheet',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/sheets/log-response
 * Log a user response (like/dislike) to Google Sheets
 */
router.post('/log-response', optionalAuth, async (req, res) => {
  try {
    const { error, value } = logResponseSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const { post, solution, rating, feedback } = value;

    console.log(`📝 Logging ${rating} response for post: ${post.id}`);

    // Get user information (use demo data if not authenticated)
    const userId = req.user?.id || 'demo_user';
    const username = req.user?.username || 'demo_user';

    const result = await sheetsClient.logResponse({
      post,
      solution,
      rating,
      feedback: feedback || '',
      userId,
      username
    });

    res.json({
      success: true,
      message: 'Response logged successfully',
      data: {
        postId: post.id,
        subreddit: post.subreddit,
        rating,
        timestamp: result.timestamp,
        sheetName: result.sheetName
      }
    });

  } catch (error) {
    console.error('Error logging response:', error);
    
    if (error.message.includes('quota')) {
      return res.status(429).json({
        success: false,
        error: 'Google Sheets API quota exceeded',
        suggestion: 'Please try again later'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to log response',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/sheets/statistics
 * Get user-specific statistics from logged responses
 */
router.get('/statistics', authenticate, async (req, res) => {
  try {
    console.log(`📈 Fetching user statistics for ${req.user.username}...`);

    const stats = await sheetsClient.getUserStatistics(req.user.id, req.user.username);

    res.json({
      success: true,
      statistics: stats,
      metadata: {
        userId: req.user.id,
        username: req.user.username,
        fetchedAt: new Date().toISOString(),
        likeRate: stats.totalResponses > 0 ?
          Math.round((stats.likes / stats.totalResponses) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching user statistics:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



/**
 * GET /api/sheets/health
 * Test Google Sheets connection
 */
router.get('/health', async (req, res) => {
  try {
    const isConnected = await sheetsClient.testConnection();
    
    if (isConnected) {
      res.json({
        success: true,
        status: 'connected',
        message: 'Google Sheets connection is healthy',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'disconnected',
        error: 'Cannot connect to Google Sheets',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Sheets health check failed:', error);
    
    res.status(503).json({
      success: false,
      status: 'error',
      error: 'Google Sheets health check failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/sheets/clear-data
 * Clear all data from the spreadsheet (keep headers)
 */
router.delete('/clear-data', async (req, res) => {
  try {
    // Add basic authentication check for destructive operations
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Admin token required for data clearing'
      });
    }

    console.log('🗑️ Clearing spreadsheet data...');
    
    await sheetsClient.clearData();

    res.json({
      success: true,
      message: 'Spreadsheet data cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing data:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear spreadsheet data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/sheets/export
 * Get all logged data for export
 */
router.get('/export', async (req, res) => {
  try {
    // Add basic authentication check for data export
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Admin token required for data export'
      });
    }

    console.log('📤 Exporting spreadsheet data...');
    
    const stats = await sheetsClient.getStatistics();

    res.json({
      success: true,
      data: {
        statistics: stats,
        exportedAt: new Date().toISOString(),
        totalRecords: stats.totalResponses
      }
    });

  } catch (error) {
    console.error('Error exporting data:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to export data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
