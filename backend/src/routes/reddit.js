const express = require('express');
const Joi = require('joi');
const RedditClient = require('../clients/redditClient');

const router = express.Router();
const redditClient = new RedditClient();

// Validation schemas
const subredditSchema = Joi.object({
  subreddit: Joi.string().alphanum().min(1).max(50).required(),
  sortBy: Joi.string().valid('hot', 'new', 'top').default('hot'),
  limit: Joi.number().integer().min(5).max(100).default(25)
});

const fetchPostsSchema = Joi.object({
  subreddit: Joi.string().alphanum().min(1).max(50).required(),
  sortBy: Joi.string().valid('hot', 'new', 'top').default('hot'),
  limit: Joi.number().integer().min(10).max(100).default(50),
  count: Joi.number().integer().min(1).max(20).default(10)
});

/**
 * GET /api/reddit/popular-subreddits
 * Get list of popular subreddits for dropdown
 */
router.get('/popular-subreddits', (req, res) => {
  try {
    const subreddits = redditClient.getPopularSubreddits();
    res.json({
      success: true,
      subreddits: subreddits.map(name => ({
        name,
        displayName: `r/${name}`,
        value: name
      }))
    });
  } catch (error) {
    console.error('Error getting popular subreddits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular subreddits'
    });
  }
});

/**
 * POST /api/reddit/validate-subreddit
 * Validate if a subreddit exists and is accessible
 */
router.post('/validate-subreddit', async (req, res) => {
  try {
    const { error, value } = Joi.object({
      subreddit: Joi.string().alphanum().min(1).max(50).required()
    }).validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subreddit name',
        details: error.details
      });
    }

    const { subreddit } = value;
    const isValid = await redditClient.validateSubreddit(subreddit);

    res.json({
      success: true,
      isValid,
      subreddit,
      message: isValid ? 'Subreddit is valid' : 'Subreddit not found or inaccessible'
    });

  } catch (error) {
    console.error('Error validating subreddit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate subreddit'
    });
  }
});

/**
 * POST /api/reddit/fetch-posts
 * Fetch multiple question posts from specified subreddit
 */
router.post('/fetch-posts', async (req, res) => {
  try {
    const { error, value } = fetchPostsSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const { subreddit, sortBy, limit, count } = value;

    // Validate subreddit first
    const isValid = await redditClient.validateSubreddit(subreddit);
    if (!isValid) {
      return res.status(404).json({
        success: false,
        error: `Subreddit r/${subreddit} not found or inaccessible`
      });
    }

    // Fetch multiple question posts
    const posts = await redditClient.fetchQuestionPosts(subreddit, sortBy, limit, count);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No question posts found in r/${subreddit}`,
        suggestion: 'Try a different subreddit or sort method'
      });
    }

    res.json({
      success: true,
      posts,
      metadata: {
        subreddit,
        sortBy,
        searchLimit: limit,
        requestedCount: count,
        returnedCount: posts.length,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

/**
 * POST /api/reddit/fetch-post
 * Fetch a single question post from specified subreddit (legacy endpoint)
 */
router.post('/fetch-post', async (req, res) => {
  try {
    const { error, value } = subredditSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details
      });
    }

    const { subreddit, sortBy, limit } = value;

    // Validate subreddit first
    const isValid = await redditClient.validateSubreddit(subreddit);
    if (!isValid) {
      return res.status(404).json({
        success: false,
        error: `Subreddit r/${subreddit} not found or inaccessible`
      });
    }

    // Fetch question post
    const post = await redditClient.fetchQuestionPost(subreddit, sortBy, limit);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: `No question posts found in r/${subreddit}`,
        suggestion: 'Try a different subreddit or sort method'
      });
    }

    res.json({
      success: true,
      post,
      metadata: {
        subreddit,
        sortBy,
        searchLimit: limit,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching Reddit post:', error);
    
    // Handle specific Reddit API errors
    if (error.message.includes('403')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to subreddit',
        suggestion: 'The subreddit may be private or restricted'
      });
    }
    
    if (error.message.includes('404')) {
      return res.status(404).json({
        success: false,
        error: 'Subreddit not found',
        suggestion: 'Check the subreddit name spelling'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch Reddit post',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/reddit/subreddit/:name/info
 * Get information about a specific subreddit
 */
router.get('/subreddit/:name/info', async (req, res) => {
  try {
    const { error, value } = Joi.object({
      name: Joi.string().alphanum().min(1).max(50).required()
    }).validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subreddit name'
      });
    }

    const { name } = value;

    try {
      // Fetch subreddit info using JSON API
      const response = await redditClient.client.get(`/r/${name}/about.json`);
      const subredditData = response.data.data;

      const info = {
        name: subredditData.display_name,
        title: subredditData.title,
        description: subredditData.public_description,
        subscribers: subredditData.subscribers,
        created: new Date(subredditData.created_utc * 1000).toISOString(),
        isNSFW: subredditData.over18,
        url: `https://www.reddit.com/r/${subredditData.display_name}`
      };

      res.json({
        success: true,
        subreddit: info
      });

    } catch (fetchError) {
      res.status(404).json({
        success: false,
        error: `Subreddit r/${name} not found or inaccessible`
      });
    }

  } catch (error) {
    console.error('Error getting subreddit info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subreddit information'
    });
  }
});

module.exports = router;
