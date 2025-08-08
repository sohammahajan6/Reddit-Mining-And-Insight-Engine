import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, User, Calendar, TrendingUp, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { BookmarkSolutionButton, BookmarkPostButton } from './BookmarkButton';

const MultipleSolutionsDisplay = ({ postSolutions, onLike, onDislike, onRegenerateSolution, onRetryGeneration, isLoading }) => {
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [retryingPosts, setRetryingPosts] = useState(new Set());
  const { isDark } = useTheme();

  // Check if an error is retryable (service unavailable, rate limit, etc.)
  const isRetryableError = (error) => {
    if (!error) return false;
    const errorLower = error.toLowerCase();
    return errorLower.includes('service unavailable') ||
           errorLower.includes('failed to generate solution because of service unavailable') ||
           errorLower.includes('temporarily busy') ||
           errorLower.includes('overloaded') ||
           errorLower.includes('503') ||
           errorLower.includes('rate limit') ||
           errorLower.includes('429') ||
           errorLower.includes('network') ||
           errorLower.includes('connection') ||
           errorLower.includes('ai service is temporarily busy') ||
           errorLower.includes('too many requests') ||
           errorLower.includes('please try again') ||
           errorLower.includes('🤖') ||
           errorLower.includes('⏱️') ||
           errorLower.includes('🌐');
  };

  // Handle retry for a specific post
  const handleRetry = async (post) => {
    if (!onRetryGeneration) return;

    setRetryingPosts(prev => new Set([...prev, post.id]));

    try {
      // For retry, we just regenerate without logging a dislike
      await onRetryGeneration(post);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setRetryingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(post.id);
        return newSet;
      });
    }
  };

  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    // Find the first paragraph or section for preview
    const firstSection = text.split('\n\n')[0];
    if (firstSection.length <= maxLength) return firstSection;
    return text.substring(0, maxLength);
  };

  const formatSolutionText = (text) => {
    // Split by double newlines to create sections
    const sections = text.split('\n\n');

    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return null;

      // Check for headers (## Header)
      if (trimmedSection.startsWith('## ')) {
        const headerText = trimmedSection.replace('## ', '');
        return (
          <h3
            key={index}
            className="text-lg font-semibold mt-4 mb-2 pb-1 border-b"
            style={{
              color: isDark ? '#60a5fa' : '#1e40af',
              borderColor: isDark ? '#30363d' : '#e5e7eb'
            }}
          >
            {headerText}
          </h3>
        );
      }

      // Check for bullet points (• item)
      if (trimmedSection.includes('•')) {
        const items = trimmedSection.split('\n').filter(line => line.trim().startsWith('•'));
        if (items.length > 0) {
          return (
            <div key={index} className="mb-3">
              <ul className="space-y-1">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mt-2 mr-2 flex-shrink-0"
                      style={{
                        backgroundColor: isDark ? '#60a5fa' : '#3b82f6'
                      }}
                    ></span>
                    <span className="text-sm leading-relaxed">
                      {formatInlineText(item.replace('•', '').trim())}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
      }

      // Regular paragraph
      return (
        <p key={index} className="mb-3 text-sm leading-relaxed">
          {formatInlineText(trimmedSection)}
        </p>
      );
    }).filter(Boolean);
  };

  const formatInlineText = (text) => {
    // Handle **bold** text
    return text.split(/(\*\*[^*]+\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} style={{ color: isDark ? '#f1f5f9' : '#1f2937' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const toggleExpanded = (postId) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };



  const handleImproveClick = (post, solution) => {
    setFeedbackModal({ post, solution });
    setFeedback('');
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim() || !feedbackModal) return;

    setIsSubmittingFeedback(true);
    try {
      await onRegenerateSolution(feedbackModal.post, feedbackModal.solution, feedback);
      setFeedbackModal(null);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const closeFeedbackModal = () => {
    setFeedbackModal(null);
    setFeedback('');
  };

  if (postSolutions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No solutions generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI-Generated Solutions
        </h2>
        <p className="text-gray-600">
          {postSolutions.length} solution{postSolutions.length !== 1 ? 's' : ''} generated
        </p>
      </div>

      {postSolutions.map((item) => {
        const { post, solution, error } = item;
        const isExpanded = expandedPosts.has(post.id);

        return (
          <div
            key={post.id}
            className="rounded-xl shadow-soft border overflow-hidden"
            style={{
              backgroundColor: isDark ? '#161b22' : 'white',
              borderColor: isDark ? '#30363d' : '#e5e7eb'
            }}
          >
            {/* Problem Section */}
            <div
              className="p-6 border-b"
              style={{
                backgroundColor: isDark ? '#21262d' : '#f8fafc',
                borderColor: isDark ? '#30363d' : '#e5e7eb'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                      Problem
                    </h4>
                    <p className="text-xs" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                      Original Question
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpanded(post.id)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    color: isDark ? '#8b949e' : '#6b7280',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isDark ? '#262c36' : '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>

              <h3
                className="text-lg font-semibold mb-3 leading-tight"
                style={{color: isDark ? '#f0f6fc' : '#111827'}}
              >
                {post.title}
              </h3>

              {/* Post Body */}
              {post.body && (
                <div
                  className="p-4 rounded-lg mb-4"
                  style={{
                    backgroundColor: isDark ? '#161b22' : '#ffffff',
                    border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`
                  }}
                >
                  <p
                    className="text-sm leading-relaxed"
                    style={{color: isDark ? '#8b949e' : '#374151'}}
                  >
                    {isExpanded ? post.body : truncateText(post.body, 200)}
                    {!isExpanded && post.body.length > 200 && (
                      <span className="text-blue-500 ml-1 cursor-pointer" onClick={() => toggleExpanded(post.id)}>
                        ...read more
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Post Metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs">
                  <div
                    className="flex items-center space-x-1 px-2 py-1 rounded-md"
                    style={{backgroundColor: isDark ? '#262c36' : '#f1f5f9'}}
                  >
                    <User className="h-3 w-3" style={{color: isDark ? '#8b949e' : '#64748b'}} />
                    <span style={{color: isDark ? '#f0f6fc' : '#374151'}}>u/{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-md">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-700">{post.score}</span>
                  </div>
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 rounded-md">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-700">{post.numComments}</span>
                  </div>
                  <div
                    className="flex items-center space-x-1 px-2 py-1 rounded-md"
                    style={{backgroundColor: isDark ? '#262c36' : '#f1f5f9'}}
                  >
                    <Calendar className="h-3 w-3" style={{color: isDark ? '#8b949e' : '#64748b'}} />
                    <span style={{color: isDark ? '#f0f6fc' : '#374151'}}>{formatTimeAgo(post.created)}</span>
                  </div>
                </div>

                {/* Bookmark Post Button */}
                <BookmarkPostButton
                  title={post.title}
                  subreddit={post.subreddit}
                  postId={post.id}
                  url={post.url}
                  category="Reddit Posts"
                  size="sm"
                  showText={false}
                />
              </div>
            </div>

            {/* Solution Section */}
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                    AI Solution
                  </h4>
                  <p className="text-xs" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
                    Generated by Gemini AI
                  </p>
                </div>
              </div>

              {error ? (
                <div
                  className="border rounded-lg p-4"
                  style={{
                    backgroundColor: isDark ? '#2d1b1b' : '#fef2f2',
                    borderColor: isDark ? '#5b2626' : '#fecaca'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p
                        className="text-sm"
                        style={{color: isDark ? '#fca5a5' : '#dc2626'}}
                      >
                        <strong>Error generating solution:</strong> {error}
                      </p>
                      {/* Debug info to see what error we're getting */}
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs mt-1 opacity-70">
                          Debug: isRetryable = {isRetryableError(error).toString()}, error = "{error}"
                        </p>
                      )}
                    </div>

                    {(isRetryableError(error) || process.env.NODE_ENV === 'development') && (
                      <button
                        onClick={() => handleRetry(post)}
                        disabled={retryingPosts.has(post.id)}
                        className="ml-3 flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
                        style={{
                          backgroundColor: isDark ? '#374151' : '#f3f4f6',
                          color: isDark ? '#d1d5db' : '#374151',
                          border: `1px solid ${isDark ? '#4b5563' : '#d1d5db'}`
                        }}
                      >
                        {retryingPosts.has(post.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                            <span>Retrying...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            <span>Retry</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : solution ? (
                <div className="space-y-4">
                  {!isExpanded ? (
                    // Collapsed state - Show preview with "Read Solution" button
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDark ? '#0d1117' : '#f8fafc',
                        borderColor: isDark ? '#30363d' : '#e5e7eb'
                      }}
                    >
                      <div
                        className="text-sm leading-relaxed mb-4"
                        style={{color: isDark ? '#8b949e' : '#374151'}}
                      >
                        {truncateText(solution, 150)}...
                      </div>
                      <button
                        onClick={() => toggleExpanded(post.id)}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Read Full Solution
                      </button>
                    </div>
                  ) : (
                    // Expanded state - Show full solution
                    <div
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: isDark ? '#0d1117' : '#ffffff',
                        borderColor: isDark ? '#30363d' : '#e5e7eb'
                      }}
                    >
                      <div
                        className="prose prose-sm max-w-none leading-relaxed"
                        style={{color: isDark ? '#f0f6fc' : '#1f2937'}}
                      >
                        {formatSolutionText(solution)}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Only show when expanded */}
                  {isExpanded && (
                    <div
                      className="flex items-center justify-between pt-4 mt-4 border-t"
                      style={{borderColor: isDark ? '#30363d' : '#e5e7eb'}}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => onLike(post, solution)}
                          disabled={isLoading}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Like
                        </button>
                        <button
                          onClick={() => handleImproveClick(post, solution)}
                          disabled={isLoading}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          Improve
                        </button>

                        <BookmarkSolutionButton
                          title={`Solution for "${post.title}"`}
                          content={solution}
                          subreddit={post.subreddit}
                          postUrl={post.url}
                          template={post.solutionOptions?.template}
                          tone={post.solutionOptions?.tone}
                          length={post.solutionOptions?.length}
                          category="AI Solutions"
                          showText={true}
                          size="sm"
                        />
                      </div>
                      <div
                        className="text-xs"
                        style={{color: isDark ? '#8b949e' : '#6b7280'}}
                      >
                        {solution.split(' ').length} words • {Math.ceil(solution.split(' ').length / 200)} min read
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="medium" />
                  <span className="ml-3 text-gray-600">Generating solution...</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Summary Actions */}
      {postSolutions.filter(item => item.solution && !item.error).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-blue-800 text-sm mb-3">
              <strong>All solutions generated!</strong> You can like individual solutions or start over with new posts.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Improve Solution
                </h3>
                <button
                  onClick={closeFeedbackModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {feedbackModal.post.title}
                </h4>
                <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 max-h-32 overflow-y-auto">
                  {feedbackModal.solution}
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to improve about this solution?
                </label>
                <textarea
                  id="feedback"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please provide specific feedback on what should be improved..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Be specific about what you'd like to see changed or improved.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeFeedbackModal}
                  disabled={isSubmittingFeedback}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback.trim() || isSubmittingFeedback}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"></div>
                      Regenerating...
                    </>
                  ) : (
                    'Regenerate Solution'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultipleSolutionsDisplay;
