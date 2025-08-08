import { apiRequest, handleApiError } from './api';
import toast from 'react-hot-toast';

/**
 * Fetch popular subreddits for dropdown
 * @returns {Promise<Array>} Array of subreddit options
 */
export const getPopularSubreddits = async () => {
  try {
    const response = await apiRequest.get('/reddit/popular-subreddits');
    return response.data.subreddits;
  } catch (error) {
    const message = handleApiError(error, 'Failed to load popular subreddits');
    throw new Error(message);
  }
};

/**
 * Validate if a subreddit exists and is accessible
 * @param {string} subreddit - Subreddit name
 * @returns {Promise<boolean>} True if valid
 */
export const validateSubreddit = async (subreddit) => {
  try {
    const response = await apiRequest.post('/reddit/validate-subreddit', {
      subreddit: subreddit.trim()
    });
    return response.data.isValid;
  } catch (error) {
    console.error('Subreddit validation error:', error);
    return false;
  }
};

/**
 * Fetch multiple question posts from specified subreddit
 * @param {string} subreddit - Subreddit name
 * @param {string} sortBy - Sort method ('hot', 'new', 'top')
 * @param {number} limit - Number of posts to search through
 * @param {number} count - Number of posts to return
 * @returns {Promise<Array>} Array of Reddit post objects
 */
export const fetchRedditPosts = async (subreddit, sortBy = 'hot', limit = 50, count = 10) => {
  try {
    toast.loading(`Searching r/${subreddit} for ${count} questions...`, { id: 'fetch-posts' });

    const response = await apiRequest.post('/reddit/fetch-posts', {
      subreddit: subreddit.trim(),
      sortBy,
      limit,
      count
    });

    toast.success(`Found ${response.data.posts.length} questions in r/${subreddit}!`, { id: 'fetch-posts' });
    return response.data.posts;

  } catch (error) {
    toast.dismiss('fetch-posts');

    if (error.response?.status === 404) {
      if (error.response.data.error.includes('not found')) {
        toast.error(`Subreddit r/${subreddit} not found`);
        throw new Error(`Subreddit r/${subreddit} does not exist or is private`);
      } else {
        toast.error(`No questions found in r/${subreddit}`);
        throw new Error(`No question posts found in r/${subreddit}. Try a different subreddit.`);
      }
    }

    const message = handleApiError(error, 'Failed to fetch posts');
    throw new Error(message);
  }
};

/**
 * Fetch a single question post from specified subreddit
 * @param {string} subreddit - Subreddit name
 * @param {string} sortBy - Sort method ('hot', 'new', 'top')
 * @param {number} limit - Number of posts to search through
 * @returns {Promise<Object>} Reddit post object
 */
export const fetchRedditPost = async (subreddit, sortBy = 'hot', limit = 25) => {
  try {
    toast.loading(`Searching r/${subreddit} for questions...`, { id: 'fetch-post' });
    
    const response = await apiRequest.post('/reddit/fetch-post', {
      subreddit: subreddit.trim(),
      sortBy,
      limit
    });
    
    toast.success(`Found question in r/${subreddit}!`, { id: 'fetch-post' });
    return response.data.post;
    
  } catch (error) {
    toast.dismiss('fetch-post');
    
    if (error.response?.status === 404) {
      const message = error.response.data.error || `No questions found in r/${subreddit}`;
      toast.error(message);
      throw new Error(message);
    }
    
    const message = handleApiError(error, `Failed to fetch post from r/${subreddit}`);
    throw new Error(message);
  }
};

/**
 * Get information about a specific subreddit
 * @param {string} subreddit - Subreddit name
 * @returns {Promise<Object>} Subreddit information
 */
export const getSubredditInfo = async (subreddit) => {
  try {
    const response = await apiRequest.get(`/reddit/subreddit/${subreddit}/info`);
    return response.data.subreddit;
  } catch (error) {
    const message = handleApiError(error, `Failed to get info for r/${subreddit}`);
    throw new Error(message);
  }
};

/**
 * Search for posts with different parameters
 * @param {Object} params - Search parameters
 * @param {string} params.subreddit - Subreddit name
 * @param {string} params.sortBy - Sort method
 * @param {number} params.limit - Search limit
 * @returns {Promise<Object>} Search results
 */
export const searchPosts = async ({ subreddit, sortBy = 'hot', limit = 25 }) => {
  try {
    const response = await apiRequest.post('/reddit/fetch-post', {
      subreddit: subreddit.trim(),
      sortBy,
      limit
    });
    
    return {
      post: response.data.post,
      metadata: response.data.metadata
    };
    
  } catch (error) {
    const message = handleApiError(error, 'Failed to search posts');
    throw new Error(message);
  }
};

/**
 * Get trending subreddits (mock implementation for future enhancement)
 * @returns {Promise<Array>} Array of trending subreddit names
 */
export const getTrendingSubreddits = async () => {
  // This would typically call a real API endpoint
  // For now, return a static list of trending subreddits
  return [
    'askreddit',
    'explainlikeimfive',
    'nostupidquestions',
    'advice',
    'relationships',
    'careerquestions'
  ];
};

/**
 * Format post data for display
 * @param {Object} post - Raw post data
 * @returns {Object} Formatted post data
 */
export const formatPostData = (post) => {
  if (!post) return null;
  
  return {
    ...post,
    formattedDate: new Date(post.created).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    shortTitle: post.title.length > 100 ? 
      post.title.substring(0, 100) + '...' : 
      post.title,
    shortBody: post.body && post.body.length > 300 ? 
      post.body.substring(0, 300) + '...' : 
      post.body,
    redditUrl: post.url,
    subredditUrl: `https://reddit.com/r/${post.subreddit}`
  };
};

/**
 * Check if a post looks like a question (client-side validation)
 * @param {Object} post - Post object
 * @returns {boolean} True if post appears to be a question
 */
export const isQuestionPost = (post) => {
  if (!post || !post.title) return false;
  
  const title = post.title.toLowerCase();
  const body = (post.body || '').toLowerCase();
  
  const questionIndicators = [
    '?', 'how', 'what', 'why', 'when', 'where', 'who', 'which',
    'should', 'would', 'could', 'can', 'help', 'advice'
  ];
  
  return questionIndicators.some(indicator => 
    title.includes(indicator) || body.includes(indicator)
  );
};

export default {
  getPopularSubreddits,
  validateSubreddit,
  fetchRedditPost,
  getSubredditInfo,
  searchPosts,
  getTrendingSubreddits,
  formatPostData,
  isQuestionPost
};
