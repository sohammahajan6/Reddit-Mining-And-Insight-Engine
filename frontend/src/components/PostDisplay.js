import React from 'react';
import { ExternalLink, User, MessageCircle, ArrowUp, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const PostDisplay = ({ post }) => {
  const { isDark } = useTheme();
  if (!post) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="reddit-post hover-lift">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gradient-to-r from-reddit-orange to-accent-orange rounded-xl px-3 py-1.5 shadow-soft">
            <span className="text-white font-bold text-sm">r/{post.subreddit}</span>
          </div>
          <span className="text-secondary-300">•</span>
          <div className="flex items-center text-secondary-600 text-sm">
            <div className="bg-secondary-100 rounded-lg p-1.5 mr-2">
              <User className="h-3 w-3" />
            </div>
            <span className="font-medium">u/{post.author}</span>
          </div>
        </div>

        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium transition-all duration-200 hover:scale-105 focus-ring rounded-lg px-3 py-2"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Reddit
        </a>
      </div>

      {/* Post Title */}
      <h3 className="text-xl font-bold text-secondary-900 mb-4 leading-tight hover:text-primary-700 transition-colors">
        {post.title}
      </h3>

      {/* Post Body */}
      {post.body && (
        <div className="prose prose-sm max-w-none mb-6">
          <div className="text-secondary-700 whitespace-pre-wrap leading-relaxed bg-secondary-50/50 rounded-xl p-4 border border-secondary-200/50">
            {post.body}
          </div>
        </div>
      )}

      {/* Post Metadata */}
      <div className="flex items-center justify-between pt-4 border-t border-secondary-200/50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center text-green-600 bg-green-50 rounded-lg px-3 py-1.5">
            <ArrowUp className="h-4 w-4 mr-1.5" />
            <span className="font-semibold">{formatNumber(post.score)}</span>
            <span className="ml-1 text-green-500">upvotes</span>
          </div>

          <div className="flex items-center text-primary-600 bg-primary-50 rounded-lg px-3 py-1.5">
            <MessageCircle className="h-4 w-4 mr-1.5" />
            <span className="font-semibold">{formatNumber(post.numComments)}</span>
            <span className="ml-1 text-primary-500">comments</span>
          </div>

          <div className="flex items-center text-secondary-600 bg-secondary-100 rounded-lg px-3 py-1.5">
            <Calendar className="h-4 w-4 mr-1.5" />
            <span className="font-medium">{formatDate(post.created)}</span>
          </div>
        </div>

        <div className="text-xs text-secondary-400 font-mono bg-secondary-50 rounded-lg px-2 py-1">
          ID: {post.id}
        </div>
      </div>
    </div>
  );
};

export default PostDisplay;
