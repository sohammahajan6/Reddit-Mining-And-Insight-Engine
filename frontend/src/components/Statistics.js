import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, ThumbsUp, ThumbsDown, X, Download, RefreshCw } from 'lucide-react';
import { getStatistics, formatStatistics, generateInsights } from '../services/sheetsService';
import LoadingSpinner from './LoadingSpinner';

const Statistics = ({ onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      const rawStats = await getStatistics();
      setStats(formatStatistics(rawStats));
    } catch (err) {
      console.error('Failed to load statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!stats) return;
    
    const dataStr = JSON.stringify(stats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reddit-gemini-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Statistics</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <LoadingSpinner text="Loading statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Statistics</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadStatistics} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats || !stats.hasData) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">My Statistics</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No personal data available yet</p>
          <p className="text-sm text-gray-500">Generate some AI solutions to see your statistics!</p>
        </div>
      </div>
    );
  }

  const insights = generateInsights(stats);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-gemini-blue" />
          <h3 className="text-lg font-semibold text-gray-900">My Statistics</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadStatistics}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Download statistics"
          >
            <Download className="h-4 w-4" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Solutions</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalResponses}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Liked</p>
              <p className="text-2xl font-bold text-green-900">{stats.likes}</p>
            </div>
            <ThumbsUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Disliked</p>
              <p className="text-2xl font-bold text-red-900">{stats.dislikes}</p>
            </div>
            <ThumbsDown className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-purple-900">{stats.likeRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Top Subreddits */}
      {stats.topSubreddits.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Top Subreddits</h4>
          <div className="space-y-2">
            {stats.topSubreddits.map((subreddit, index) => (
              <div key={subreddit.subreddit} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="font-medium text-reddit-orange">r/{subreddit.subreddit}</span>
                </div>
                <span className="text-sm text-gray-600">{subreddit.count} solutions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Insights</h4>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-500 mt-0.5">•</span>
              <span className="text-sm text-blue-800">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-2 text-sm border-l-2 border-gray-200 pl-3">
                <div>
                  <span className="font-medium">r/{activity.subreddit}</span>
                  <span className="text-gray-600 ml-2">{activity.title.substring(0, 50)}...</span>
                </div>
                <div className="flex items-center space-x-2">
                  {activity.rating === 'like' ? (
                    <ThumbsUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <ThumbsDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
