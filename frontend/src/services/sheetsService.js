import { apiRequest, handleApiError } from './api';
import toast from 'react-hot-toast';

/**
 * Initialize Google Sheets with proper headers
 * @returns {Promise<Object>} Initialization result
 */
export const initializeSheets = async () => {
  try {
    const response = await apiRequest.post('/sheets/initialize');
    return response.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to initialize Google Sheets');
    throw new Error(message);
  }
};

/**
 * Log a user response (like/dislike) to Google Sheets
 * @param {Object} data - Response data
 * @param {Object} data.post - Reddit post object
 * @param {string} data.solution - Generated solution
 * @param {string} data.rating - 'like' or 'dislike'
 * @param {string} data.feedback - Optional feedback text
 * @returns {Promise<Object>} Log result
 */
export const logResponse = async ({ post, solution, rating, feedback = '' }) => {
  try {
    const loadingMessage = rating === 'like' ? 
      'Saving your positive feedback...' : 
      'Logging feedback for improvement...';
    
    toast.loading(loadingMessage, { id: 'log-response' });
    
    const response = await apiRequest.post('/sheets/log-response', {
      post,
      solution,
      rating,
      feedback
    });
    
    const successMessage = rating === 'like' ? 
      'Thanks for the positive feedback! 👍' : 
      'Feedback logged for improvement 📝';
    
    toast.success(successMessage, { id: 'log-response' });
    
    return response.data;
    
  } catch (error) {
    toast.dismiss('log-response');
    
    if (error.response?.status === 403) {
      toast.error('Permission denied to save data');
      throw new Error('Google Sheets access denied');
    }
    
    if (error.response?.status === 429) {
      toast.error('Too many requests - data not saved');
      throw new Error('Rate limit exceeded for Google Sheets');
    }
    
    const message = handleApiError(error, 'Failed to save response');
    throw new Error(message);
  }
};

/**
 * Get statistics from logged responses
 * @returns {Promise<Object>} Statistics data
 */
export const getStatistics = async () => {
  try {
    const response = await apiRequest.get('/sheets/statistics');
    return response.data.statistics;
  } catch (error) {
    const message = handleApiError(error, 'Failed to fetch statistics');
    throw new Error(message);
  }
};

/**
 * Check Google Sheets service health
 * @returns {Promise<Object>} Health status
 */
export const checkSheetsHealth = async () => {
  try {
    const response = await apiRequest.get('/sheets/health');
    return response.data;
  } catch (error) {
    throw new Error('Google Sheets service is unavailable');
  }
};

/**
 * Clear all data from Google Sheets (admin only)
 * @param {string} adminToken - Admin authentication token
 * @returns {Promise<Object>} Clear result
 */
export const clearSheetsData = async (adminToken) => {
  try {
    toast.loading('Clearing all data...', { id: 'clear-data' });
    
    const response = await apiRequest.delete('/sheets/clear-data', {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    
    toast.success('All data cleared successfully', { id: 'clear-data' });
    return response.data;
    
  } catch (error) {
    toast.dismiss('clear-data');
    
    if (error.response?.status === 401) {
      toast.error('Unauthorized - admin access required');
      throw new Error('Admin authentication required');
    }
    
    const message = handleApiError(error, 'Failed to clear data');
    throw new Error(message);
  }
};

/**
 * Export all data from Google Sheets (admin only)
 * @param {string} adminToken - Admin authentication token
 * @returns {Promise<Object>} Export data
 */
export const exportSheetsData = async (adminToken) => {
  try {
    toast.loading('Exporting data...', { id: 'export-data' });
    
    const response = await apiRequest.get('/sheets/export', {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    
    toast.success('Data exported successfully', { id: 'export-data' });
    return response.data;
    
  } catch (error) {
    toast.dismiss('export-data');
    
    if (error.response?.status === 401) {
      toast.error('Unauthorized - admin access required');
      throw new Error('Admin authentication required');
    }
    
    const message = handleApiError(error, 'Failed to export data');
    throw new Error(message);
  }
};

/**
 * Format statistics for display
 * @param {Object} stats - Raw statistics data
 * @returns {Object} Formatted statistics
 */
export const formatStatistics = (stats) => {
  if (!stats) return null;
  
  const { totalResponses, likes, dislikes, topSubreddits, recentActivity } = stats;
  
  return {
    totalResponses,
    likes,
    dislikes,
    likeRate: totalResponses > 0 ? Math.round((likes / totalResponses) * 100) : 0,
    dislikeRate: totalResponses > 0 ? Math.round((dislikes / totalResponses) * 100) : 0,
    topSubreddits: topSubreddits.slice(0, 5), // Top 5 subreddits
    recentActivity: recentActivity.slice(0, 10), // Last 10 activities
    hasData: totalResponses > 0
  };
};

/**
 * Generate summary insights from statistics
 * @param {Object} stats - Statistics data
 * @returns {Array} Array of insight strings
 */
export const generateInsights = (stats) => {
  if (!stats || stats.totalResponses === 0) {
    return ['No data available yet. Start using the app to see insights!'];
  }
  
  const insights = [];
  const { totalResponses, likes, dislikes, topSubreddits, likeRate } = formatStatistics(stats);
  
  // Response volume insight
  if (totalResponses > 0) {
    insights.push(`Generated ${totalResponses} solution${totalResponses === 1 ? '' : 's'} so far`);
  }
  
  // Success rate insight
  if (likeRate >= 80) {
    insights.push(`Excellent ${likeRate}% success rate! 🎉`);
  } else if (likeRate >= 60) {
    insights.push(`Good ${likeRate}% success rate 👍`);
  } else if (likeRate >= 40) {
    insights.push(`${likeRate}% success rate - room for improvement`);
  } else if (totalResponses > 5) {
    insights.push(`${likeRate}% success rate - needs attention`);
  }
  
  // Popular subreddit insight
  if (topSubreddits.length > 0) {
    const topSubreddit = topSubreddits[0];
    insights.push(`Most popular: r/${topSubreddit.subreddit} (${topSubreddit.count} solutions)`);
  }
  
  // Activity insight
  if (totalResponses >= 10) {
    insights.push('Great activity level! Keep helping Reddit users 🚀');
  } else if (totalResponses >= 5) {
    insights.push('Good start! Try exploring more subreddits');
  }
  
  return insights;
};

/**
 * Download statistics as JSON file
 * @param {Object} stats - Statistics data
 * @param {string} filename - Optional filename
 */
export const downloadStatistics = (stats, filename = 'reddit-gemini-stats.json') => {
  try {
    const dataStr = JSON.stringify(stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success('Statistics downloaded successfully');
    
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download statistics');
  }
};

export default {
  initializeSheets,
  logResponse,
  getStatistics,
  checkSheetsHealth,
  clearSheetsData,
  exportSheetsData,
  formatStatistics,
  generateInsights,
  downloadStatistics
};
