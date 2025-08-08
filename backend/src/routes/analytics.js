const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const logSolutionSchema = Joi.object({
  subreddit: Joi.string().required(),
  postId: Joi.string().required(),
  postTitle: Joi.string().required(),
  template: Joi.string().valid('general', 'relationship', 'career', 'technical', 'social').default('general'),
  tone: Joi.string().valid('empathetic', 'professional', 'casual', 'direct').default('empathetic'),
  length: Joi.string().valid('short', 'medium', 'detailed').default('medium'),
  wordCount: Joi.number().min(0).default(0),
  generationTime: Joi.number().min(0).default(0),
  sessionId: Joi.string().required()
});

const logFeedbackSchema = Joi.object({
  subreddit: Joi.string().required(),
  postId: Joi.string().required(),
  postTitle: Joi.string().required(),
  template: Joi.string().valid('general', 'relationship', 'career', 'technical', 'social').optional(),
  tone: Joi.string().valid('empathetic', 'professional', 'casual', 'direct').optional(),
  length: Joi.string().valid('short', 'medium', 'detailed').optional(),
  wordCount: Joi.number().min(0).optional(),
  generationTime: Joi.number().min(0).optional(),
  rating: Joi.string().valid('like', 'dislike').required(),
  feedback: Joi.string().max(1000).allow('').default(''),
  sessionId: Joi.string().required()
});

/**
 * POST /api/analytics/log-solution
 * Log a solution generation event
 */
router.post('/log-solution', optionalAuth, async (req, res) => {
  try {
    const { error, value } = logSolutionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const {
      subreddit,
      postId,
      postTitle,
      template,
      tone,
      length,
      wordCount,
      generationTime,
      sessionId
    } = value;

    console.log(`📊 Logging solution generation for post: ${postId}`);

    // Create analytics event
    const analyticsEvent = {
      id: uuidv4(),
      event_type: 'solution_generated',
      user_id: req.user?.id || null,
      session_id: sessionId,
      subreddit: subreddit,
      post_id: postId,
      post_title: postTitle,
      solution_template: template,
      solution_tone: tone,
      solution_length: length,
      solution_word_count: wordCount,
      generation_time: generationTime / 1000, // Convert ms to seconds
      success: true,
      event_data: JSON.stringify({}),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'] || '',
      created_at: new Date()
    };

    // Insert into database
    await db('analytics_events').insert(analyticsEvent);

    console.log('✅ Solution generation event logged successfully');

    res.json({
      success: true,
      message: 'Solution generation logged successfully',
      data: {
        eventId: analyticsEvent.id,
        postId,
        subreddit,
        timestamp: analyticsEvent.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error logging solution generation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log solution generation'
    });
  }
});

/**
 * POST /api/analytics/log-feedback
 * Log a user feedback event
 */
router.post('/log-feedback', optionalAuth, async (req, res) => {
  try {
    const { error, value } = logFeedbackSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const {
      subreddit,
      postId,
      postTitle,
      template,
      tone,
      length,
      wordCount,
      generationTime,
      rating,
      feedback,
      sessionId
    } = value;

    console.log(`📊 Logging user feedback (${rating}) for post: ${postId}`);

    // Create analytics event
    const analyticsEvent = {
      id: uuidv4(),
      event_type: 'user_feedback',
      user_id: req.user?.id || null,
      session_id: sessionId,
      subreddit: subreddit,
      post_id: postId,
      post_title: postTitle,
      solution_template: template,
      solution_tone: tone,
      solution_length: length,
      solution_word_count: wordCount,
      generation_time: generationTime ? generationTime / 1000 : null, // Convert ms to seconds
      user_rating: rating,
      feedback_text: feedback,
      success: rating === 'like',
      event_data: JSON.stringify({}),
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'] || '',
      created_at: new Date()
    };

    // Insert into database
    await db('analytics_events').insert(analyticsEvent);

    console.log('✅ User feedback event logged successfully');

    res.json({
      success: true,
      message: 'User feedback logged successfully',
      data: {
        eventId: analyticsEvent.id,
        postId,
        subreddit,
        rating,
        timestamp: analyticsEvent.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error logging user feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log user feedback'
    });
  }
});

/**
 * GET /api/analytics/health
 * Check analytics service health
 */
router.get('/health', async (req, res) => {
  try {
    // Test database connection by counting analytics events
    const result = await db('analytics_events').count('* as count').first();
    const totalEvents = parseInt(result.count);

    res.json({
      success: true,
      status: 'healthy',
      data: {
        totalEvents,
        databaseConnected: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Analytics health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Analytics service is unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
