const express = require('express');
const Joi = require('joi');
const GeminiClient = require('../clients/geminiClient');

const router = express.Router();
const geminiClient = new GeminiClient();

// Validation schemas
const generateSolutionSchema = Joi.object({
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
  feedback: Joi.string().max(1000).allow(null).optional(),
  options: Joi.object({
    template: Joi.string().valid('general', 'relationship', 'career', 'technical', 'social').default('general'),
    tone: Joi.string().valid('empathetic', 'professional', 'casual', 'direct').default('empathetic'),
    length: Joi.string().valid('short', 'medium', 'detailed').default('medium'),
    followupQuestions: Joi.boolean().default(false),
    followupAnswers: Joi.object().allow(null).optional()
  }).default({})
});

const multipleSolutionsSchema = Joi.object({
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
  count: Joi.number().integer().min(1).max(5).default(3)
});

/**
 * POST /api/gemini/generate-solution
 * Generate a solution for a Reddit post
 */
router.post('/generate-solution', async (req, res) => {
  try {
    const { error, value } = generateSolutionSchema.validate(req.body);

    if (error) {
      console.error('❌ Validation error:', error.details);
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const { post, feedback, options } = value;

    console.log(`🧠 Generating solution for post: ${post.id}`);
    console.log(`📋 Solution options:`, options);

    const startTime = Date.now();
    const solution = await geminiClient.generateSolution(post, feedback, options);
    const generationTime = Date.now() - startTime;

    // Validate the solution quality
    const validation = geminiClient.validateSolution(solution);

    res.json({
      success: true,
      solution,
      metadata: {
        postId: post.id,
        subreddit: post.subreddit,
        generationTime,
        validation,
        isRegeneration: !!feedback,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating solution:', error);
    
    // Handle specific Gemini API errors
    if (error.message.includes('API key')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or missing Gemini API key'
      });
    }

    if (error.message.includes('quota')) {
      return res.status(429).json({
        success: false,
        error: 'API quota exceeded',
        suggestion: 'Please try again later'
      });
    }

    if (error.message.includes('overloaded') || error.message.includes('503')) {
      return res.status(503).json({
        success: false,
        error: 'AI service is temporarily overloaded',
        suggestion: 'Please try again in a few minutes',
        retryAfter: 60 // seconds
      });
    }

    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        suggestion: 'Please wait before making another request',
        retryAfter: 30 // seconds
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate solution',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/gemini/generate-multiple
 * Generate multiple solution options for a Reddit post
 */
router.post('/generate-multiple', async (req, res) => {
  try {
    const { error, value } = multipleSolutionsSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const { post, count } = value;

    console.log(`🧠 Generating ${count} solutions for post: ${post.id}`);
    
    const startTime = Date.now();
    const solutions = await geminiClient.generateMultipleSolutions(post, count);
    const generationTime = Date.now() - startTime;

    // Validate each solution
    const validatedSolutions = solutions.map((solution, index) => ({
      id: `solution_${index + 1}`,
      content: solution,
      validation: geminiClient.validateSolution(solution)
    }));

    res.json({
      success: true,
      solutions: validatedSolutions,
      metadata: {
        postId: post.id,
        subreddit: post.subreddit,
        count: solutions.length,
        generationTime,
        averageLength: Math.round(solutions.reduce((sum, s) => sum + s.length, 0) / solutions.length),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating multiple solutions:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate multiple solutions',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/gemini/regenerate-solution
 * Regenerate a solution based on user feedback
 */
router.post('/regenerate-solution', async (req, res) => {
  try {
    const { error, value } = Joi.object({
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
      previousSolution: Joi.string().required(),
      feedback: Joi.string().min(10).max(1000).required()
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const { post, previousSolution, feedback } = value;

    console.log(`🔄 Regenerating solution for post: ${post.id} with feedback`);
    
    const startTime = Date.now();
    const newSolution = await geminiClient.generateSolution(post, feedback);
    const generationTime = Date.now() - startTime;

    // Validate the new solution
    const validation = geminiClient.validateSolution(newSolution);

    res.json({
      success: true,
      solution: newSolution,
      metadata: {
        postId: post.id,
        subreddit: post.subreddit,
        generationTime,
        validation,
        isRegeneration: true,
        feedback,
        previousSolutionLength: previousSolution.length,
        newSolutionLength: newSolution.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error regenerating solution:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate solution',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/gemini/validate-solution
 * Validate a solution's quality
 */
router.post('/validate-solution', (req, res) => {
  try {
    const { error, value } = Joi.object({
      solution: Joi.string().required()
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const { solution } = value;
    const validation = geminiClient.validateSolution(solution);

    res.json({
      success: true,
      validation,
      metadata: {
        solutionLength: solution.length,
        validatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error validating solution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate solution'
    });
  }
});

/**
 * GET /api/gemini/health
 * Check Gemini API health
 */
router.get('/health', async (req, res) => {
  try {
    // Simple test to check if Gemini API is accessible
    const testPost = {
      id: 'test',
      title: 'Test post',
      body: 'This is a test',
      subreddit: 'test',
      url: 'https://reddit.com/test'
    };

    const startTime = Date.now();
    await geminiClient.generateSolution(testPost);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/gemini/generate-followup-questions
 * Generate follow-up questions for a post
 */
router.post('/generate-followup-questions', async (req, res) => {
  try {
    // Validate request body
    const schema = Joi.object({
      post: Joi.object({
        id: Joi.string().required(),
        title: Joi.string().required(),
        body: Joi.string().allow(''),
        subreddit: Joi.string().required()
      }).required(),
      options: Joi.object({
        template: Joi.string().valid('general', 'relationship', 'career', 'technical', 'social').default('general'),
        tone: Joi.string().valid('empathetic', 'professional', 'casual', 'direct').default('empathetic'),
        length: Joi.string().valid('short', 'medium', 'detailed').default('medium')
      }).default({})
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { post, options } = value;

    console.log(`❓ Generating follow-up questions for post: ${post.id}`);

    const startTime = Date.now();
    const questions = await geminiClient.generateFollowUpQuestions(post, options);
    const generationTime = Date.now() - startTime;

    res.json({
      success: true,
      questions,
      metadata: {
        postId: post.id,
        subreddit: post.subreddit,
        template: options.template,
        questionCount: questions.length,
        generationTime,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating follow-up questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate follow-up questions'
    });
  }
});

module.exports = router;
