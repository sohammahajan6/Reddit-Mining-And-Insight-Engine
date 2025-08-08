import { apiRequest, handleApiError } from './api';
import toast from 'react-hot-toast';

/**
 * Log a solution generation event
 * @param {Object} data - Solution generation data
 * @returns {Promise<void>}
 */
export const logSolutionGeneration = async (data) => {
  try {
    await apiRequest.post('/analytics/log-solution', {
      subreddit: data.subreddit,
      postId: data.postId,
      postTitle: data.postTitle,
      template: data.template || 'general',
      tone: data.tone || 'empathetic',
      length: data.length || 'medium',
      wordCount: data.wordCount || 0,
      generationTime: data.generationTime || 0,
      sessionId: data.sessionId || generateSessionId()
    });
    
    console.log('📊 Solution generation logged');
  } catch (error) {
    console.error('Failed to log solution generation:', error);
    // Don't show error to user for analytics failures
  }
};

/**
 * Log user feedback event
 * @param {Object} data - User feedback data
 * @returns {Promise<void>}
 */
export const logUserFeedback = async (data) => {
  try {
    await apiRequest.post('/analytics/log-feedback', {
      subreddit: data.subreddit,
      postId: data.postId,
      postTitle: data.postTitle,
      template: data.template,
      tone: data.tone,
      length: data.length,
      wordCount: data.wordCount,
      generationTime: data.generationTime,
      rating: data.rating, // 'like' or 'dislike'
      feedback: data.feedback || '',
      sessionId: data.sessionId || generateSessionId()
    });
    
    console.log(`📊 User feedback logged: ${data.rating}`);
  } catch (error) {
    console.error('Failed to log user feedback:', error);
    // Don't show error to user for analytics failures
  }
};

/**
 * Get analytics dashboard data
 * @param {string} timeRange - Time range for analytics (24h, 7d, 30d, 90d)
 * @returns {Promise<Object>} Analytics data
 */
export const getAnalyticsDashboard = async (timeRange = '7d') => {
  try {
    const response = await apiRequest.get('/analytics/dashboard', {
      params: { timeRange }
    });
    
    return response.data.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to fetch analytics data');
    throw new Error(message);
  }
};

/**
 * Export analytics data
 * @param {string} format - Export format (csv, pdf)
 * @param {string} timeRange - Time range for export
 * @param {Object} analytics - Analytics data for PDF generation
 * @returns {Promise<Blob>} Export file blob
 */
export const exportAnalytics = async (format = 'csv', timeRange = '7d', analytics = null) => {
  try {
    toast.loading(`Generating ${format.toUpperCase()} export...`, { id: 'export-analytics' });

    if (format === 'pdf') {
      // Generate PDF on frontend using analytics data
      if (!analytics) {
        analytics = await getAnalyticsDashboard(timeRange);
      }
      await generatePDFReport(analytics, timeRange);
      toast.success('PDF export downloaded!', { id: 'export-analytics' });
      return;
    }

    // CSV export via backend
    const response = await apiRequest.get('/analytics/export', {
      params: { format, timeRange },
      responseType: 'blob'
    });

    // Create download link for CSV
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${timeRange}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('CSV export downloaded!', { id: 'export-analytics' });
    return response.data;
  } catch (error) {
    const message = handleApiError(error, 'Failed to export analytics data');
    toast.error(message, { id: 'export-analytics' });
    throw new Error(message);
  }
};

/**
 * Generate PDF report from analytics data
 * @param {Object} analytics - Analytics data
 * @param {string} timeRange - Time range
 */
const generatePDFReport = async (analytics, timeRange) => {
  // Create a simple HTML report and convert to PDF using browser's print functionality
  const reportHTML = generateHTMLReport(analytics, timeRange);

  // Create a new window with the report
  const printWindow = window.open('', '_blank');
  printWindow.document.write(reportHTML);
  printWindow.document.close();

  // Wait for content to load then trigger print
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

/**
 * Generate HTML report for PDF export
 * @param {Object} analytics - Analytics data
 * @param {string} timeRange - Time range
 * @returns {string} HTML report
 */
const generateHTMLReport = (analytics, timeRange) => {
  const { overview, subredditStats, solutionTypes, qualityMetrics } = analytics;
  const date = new Date().toLocaleDateString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reddit AI Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
        .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
        .metric-card { border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; }
        .metric-value { font-size: 2em; font-weight: bold; color: #3b82f6; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .section { margin: 40px 0; }
        .section h2 { color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; font-weight: 600; }
        .progress-bar { width: 100%; height: 8px; background-color: #f1f5f9; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background-color: #3b82f6; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reddit AI Analytics Report</h1>
        <p>Time Period: ${timeRange.toUpperCase()} | Generated: ${date}</p>
      </div>

      <div class="section">
        <h2>Overview Metrics</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-value">${overview.totalSolutions}</div>
            <div class="metric-label">Total Solutions Generated</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${overview.successRate}%</div>
            <div class="metric-label">Success Rate</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${overview.avgResponseTime}s</div>
            <div class="metric-label">Average Response Time</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${overview.totalTimeSpent}min</div>
            <div class="metric-label">Total Time Spent</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Top Performing Subreddits</h2>
        <table>
          <thead>
            <tr>
              <th>Subreddit</th>
              <th>Solutions</th>
              <th>Success Rate</th>
              <th>Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            ${subredditStats.map(stat => `
              <tr>
                <td>r/${stat.name}</td>
                <td>${stat.solutions}</td>
                <td>${stat.successRate}%</td>
                <td>${stat.avgRating}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Solution Template Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Template</th>
              <th>Count</th>
              <th>Success Rate</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            ${solutionTypes.map(type => `
              <tr>
                <td style="text-transform: capitalize;">${type.template}</td>
                <td>${type.count}</td>
                <td>${type.successRate}%</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${type.successRate}%"></div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Quality Metrics</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-value">${qualityMetrics.avgWordsPerSolution}</div>
            <div class="metric-label">Average Words per Solution</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${qualityMetrics.avgReadingTime}min</div>
            <div class="metric-label">Average Reading Time</div>
          </div>
          <div class="metric-card">
            <div class="metric-value" style="text-transform: capitalize;">${qualityMetrics.mostUsedTone}</div>
            <div class="metric-label">Most Used Tone</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">+${qualityMetrics.improvementRate}%</div>
            <div class="metric-label">Improvement Rate</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Check analytics service health
 * @returns {Promise<Object>} Health status
 */
export const checkAnalyticsHealth = async () => {
  try {
    const response = await apiRequest.get('/analytics/health');
    return response.data;
  } catch (error) {
    throw new Error('Analytics service is unavailable');
  }
};

/**
 * Generate a session ID for tracking user sessions
 * @returns {string} Session ID
 */
export const generateSessionId = () => {
  // Check if we already have a session ID in localStorage
  let sessionId = localStorage.getItem('reddit-ai-session-id');
  
  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('reddit-ai-session-id', sessionId);
  }
  
  return sessionId;
};

/**
 * Calculate word count from text
 * @param {string} text - Text to count words
 * @returns {number} Word count
 */
export const calculateWordCount = (text) => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

/**
 * Extract analytics data from solution generation
 * @param {Object} post - Reddit post object
 * @param {string} solution - Generated solution
 * @param {Object} options - Solution options
 * @param {number} generationTime - Time taken to generate solution
 * @returns {Object} Analytics data
 */
export const extractSolutionAnalytics = (post, solution, options, generationTime) => {
  return {
    subreddit: post.subreddit,
    postId: post.id,
    postTitle: post.title,
    template: options.template || 'general',
    tone: options.tone || 'empathetic',
    length: options.length || 'medium',
    wordCount: calculateWordCount(solution),
    generationTime: generationTime || 0,
    sessionId: generateSessionId()
  };
};

/**
 * Extract analytics data from user feedback
 * @param {Object} post - Reddit post object
 * @param {string} solution - Generated solution
 * @param {string} rating - User rating (like/dislike)
 * @param {string} feedback - User feedback text
 * @param {Object} options - Solution options used
 * @returns {Object} Feedback analytics data
 */
export const extractFeedbackAnalytics = (post, solution, rating, feedback, options = {}) => {
  return {
    subreddit: post.subreddit,
    postId: post.id,
    postTitle: post.title,
    template: options.template,
    tone: options.tone,
    length: options.length,
    wordCount: calculateWordCount(solution),
    generationTime: options.generationTime,
    rating,
    feedback: feedback || '',
    sessionId: generateSessionId()
  };
};

/**
 * Format analytics data for display
 * @param {Object} analytics - Raw analytics data
 * @returns {Object} Formatted analytics data
 */
export const formatAnalyticsData = (analytics) => {
  return {
    ...analytics,
    overview: {
      ...analytics.overview,
      successRate: parseFloat(analytics.overview.successRate),
      avgResponseTime: parseFloat(analytics.overview.avgResponseTime)
    },
    subredditStats: analytics.subredditStats.map(stat => ({
      ...stat,
      successRate: parseFloat(stat.successRate),
      avgRating: parseFloat(stat.avgRating)
    })),
    solutionTypes: analytics.solutionTypes.map(type => ({
      ...type,
      successRate: parseFloat(type.successRate)
    }))
  };
};

/**
 * Get analytics summary for a specific time period
 * @param {Object} analytics - Analytics data
 * @returns {Object} Summary statistics
 */
export const getAnalyticsSummary = (analytics) => {
  const { overview, subredditStats, solutionTypes } = analytics;
  
  const topSubreddit = subredditStats[0];
  const topTemplate = solutionTypes.reduce((prev, current) => 
    (prev.count > current.count) ? prev : current
  );
  
  return {
    totalSolutions: overview.totalSolutions,
    successRate: overview.successRate,
    topSubreddit: topSubreddit ? topSubreddit.name : 'N/A',
    topTemplate: topTemplate ? topTemplate.template : 'N/A',
    avgResponseTime: overview.avgResponseTime,
    timeSpent: overview.totalTimeSpent
  };
};

/**
 * Compare analytics between two time periods
 * @param {Object} current - Current period analytics
 * @param {Object} previous - Previous period analytics
 * @returns {Object} Comparison data with trends
 */
export const compareAnalytics = (current, previous) => {
  const calculateChange = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue * 100).toFixed(1);
  };
  
  return {
    solutionsChange: calculateChange(current.overview.totalSolutions, previous.overview.totalSolutions),
    successRateChange: calculateChange(current.overview.successRate, previous.overview.successRate),
    responseTimeChange: calculateChange(current.overview.avgResponseTime, previous.overview.avgResponseTime),
    timeSpentChange: calculateChange(current.overview.totalTimeSpent, previous.overview.totalTimeSpent)
  };
};

export default {
  logSolutionGeneration,
  logUserFeedback,
  getAnalyticsDashboard,
  exportAnalytics,
  checkAnalyticsHealth,
  generateSessionId,
  calculateWordCount,
  extractSolutionAnalytics,
  extractFeedbackAnalytics,
  formatAnalyticsData,
  getAnalyticsSummary,
  compareAnalytics
};
