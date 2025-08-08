const axios = require('axios');

class RedditClient {
  constructor() {
    // Use Reddit's JSON API directly - no authentication needed for public subreddits
    this.userAgent = process.env.REDDIT_USER_AGENT || 'reddit-gemini-app/1.0.0';
    this.baseURL = 'https://www.reddit.com';

    // Create axios instance with proper headers
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'User-Agent': this.userAgent
      },
      timeout: 10000
    });

    console.log('✅ Reddit client initialized (using JSON API)');
  }

  /**
   * Fetch multiple relevant question posts from a subreddit
   * @param {string} subredditName - Name of the subreddit
   * @param {string} sortBy - Sort method ('hot', 'new', 'top')
   * @param {number} limit - Number of posts to fetch and filter
   * @param {number} returnCount - Number of question posts to return
   * @returns {Array} - Array of Reddit post objects
   */
  async fetchQuestionPosts(subredditName, sortBy = 'hot', limit = 50, returnCount = 10) {
    try {
      console.log(`🔍 Fetching ${returnCount} question posts from r/${subredditName}...`);

      // Build URL for Reddit JSON API
      let url = `/r/${subredditName}`;
      switch (sortBy) {
        case 'new':
          url += '/new.json';
          break;
        case 'top':
          url += '/top.json?t=day';
          break;
        default:
          url += '/hot.json';
      }
      url += `${url.includes('?') ? '&' : '?'}limit=${limit}`;

      // Fetch posts from Reddit JSON API
      const response = await this.client.get(url);
      const posts = response.data.data.children.map(child => child.data);

      // Filter posts that look like questions
      const questionPosts = posts.filter(post => this.isQuestionPost(post));

      if (questionPosts.length === 0) {
        console.log(`❌ No question posts found in r/${subredditName}`);
        return [];
      }

      // Return the requested number of question posts
      const postsToReturn = questionPosts.slice(0, returnCount);

      console.log(`✅ Found ${postsToReturn.length} question posts`);

      return postsToReturn.map(post => ({
        id: post.id,
        title: post.title,
        body: post.selftext || '',
        url: `https://www.reddit.com${post.permalink}`,
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        created: new Date(post.created_utc * 1000).toISOString(),
        numComments: post.num_comments
      }));

    } catch (error) {
      console.error(`❌ Error fetching posts from r/${subredditName}:`, error.message);
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }
  }

  /**
   * Fetch a single random question post from a subreddit (legacy method)
   * @param {string} subredditName - Name of the subreddit
   * @param {string} sortBy - Sort method ('hot', 'new', 'top')
   * @param {number} limit - Number of posts to fetch and filter
   * @returns {Object|null} - Reddit post object or null if none found
   */
  async fetchQuestionPost(subredditName, sortBy = 'hot', limit = 25) {
    try {
      console.log(`🔍 Fetching posts from r/${subredditName}...`);

      // Build URL for Reddit JSON API
      let url = `/r/${subredditName}`;
      switch (sortBy) {
        case 'new':
          url += '/new.json';
          break;
        case 'top':
          url += '/top.json?t=day';
          break;
        default:
          url += '/hot.json';
      }
      url += `${url.includes('?') ? '&' : '?'}limit=${limit}`;

      // Fetch posts from Reddit JSON API
      const response = await this.client.get(url);
      const posts = response.data.data.children.map(child => child.data);

      // Filter posts that look like questions
      const questionPosts = posts.filter(post => this.isQuestionPost(post));

      if (questionPosts.length === 0) {
        console.log(`❌ No question posts found in r/${subredditName}`);
        return null;
      }

      // Select a random question post
      const randomPost = questionPosts[Math.floor(Math.random() * questionPosts.length)];

      console.log(`✅ Found question post: "${randomPost.title}"`);

      return {
        id: randomPost.id,
        title: randomPost.title,
        body: randomPost.selftext || '',
        url: `https://www.reddit.com${randomPost.permalink}`,
        subreddit: randomPost.subreddit,
        author: randomPost.author,
        score: randomPost.score,
        created: new Date(randomPost.created_utc * 1000).toISOString(),
        numComments: randomPost.num_comments
      };

    } catch (error) {
      console.error(`❌ Error fetching from r/${subredditName}:`, error.message);
      throw new Error(`Failed to fetch posts from r/${subredditName}: ${error.message}`);
    }
  }

  /**
   * Check if a post looks like a question
   * @param {Object} post - Reddit post object from JSON API
   * @returns {boolean} - True if post appears to be a question
   */
  isQuestionPost(post) {
    const title = post.title.toLowerCase();
    const body = (post.selftext || '').toLowerCase();

    // Question indicators
    const questionWords = [
      'how', 'what', 'why', 'when', 'where', 'who', 'which',
      'should', 'would', 'could', 'can', 'help', 'advice',
      'recommend', 'suggest', 'opinion', 'thoughts'
    ];

    const questionMarkers = ['?', 'help', 'advice', 'question'];

    // Check for question words at the beginning of title
    const startsWithQuestion = questionWords.some(word =>
      title.startsWith(word + ' ') || title.startsWith(word + "'")
    );

    // Check for question markers
    const hasQuestionMarkers = questionMarkers.some(marker =>
      title.includes(marker) || body.includes(marker)
    );

    // Must have some text content (not just a link)
    const hasContent = post.selftext && post.selftext.trim().length > 20;

    // Exclude certain post types
    const excludePatterns = [
      'daily thread', 'weekly thread', 'monthly thread',
      'megathread', 'announcement', '[meta]', 'mod post'
    ];

    const isExcluded = excludePatterns.some(pattern =>
      title.includes(pattern) || body.includes(pattern)
    );

    return (startsWithQuestion || hasQuestionMarkers) && hasContent && !isExcluded;
  }

  /**
   * Get popular subreddits for dropdown
   * @returns {Array} - List of popular subreddit names
   */
  getPopularSubreddits() {
    return [
      'advice',
      'relationships',
      'careerquestions',
      'personalfinance',
      'askreddit',
      'nostupidquestions',
      'explainlikeimfive',
      'legaladvice',
      'relationship_advice',
      'careerguidance',
      'jobs',
      'college',
      'findapath',
      'socialskills',
      'depression',
      'anxiety',
      'getmotivated'
    ];
  }

  /**
   * Validate if subreddit exists and is accessible
   * @param {string} subredditName - Name of the subreddit
   * @returns {boolean} - True if subreddit is valid
   */
  async validateSubreddit(subredditName) {
    try {
      // Try to fetch the subreddit's about page
      const response = await this.client.get(`/r/${subredditName}/about.json`);
      return response.data && response.data.data && !response.data.data.over18;
    } catch (error) {
      console.error(`❌ Invalid subreddit r/${subredditName}:`, error.message);
      return false;
    }
  }
}

module.exports = RedditClient;
