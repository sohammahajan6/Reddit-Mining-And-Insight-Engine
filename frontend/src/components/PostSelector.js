import React, { useState } from 'react';
import { MessageSquare, User, Calendar, TrendingUp, CheckSquare, Square, ExternalLink, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { BookmarkPostButton } from './BookmarkButton';

const PostSelector = ({ posts, onSelectPosts, selectedPosts, isLoading, onGenerate }) => {
  const { isDark } = useTheme();
  const [modalPost, setModalPost] = useState(null);
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

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handlePostToggle = (post) => {
    const isSelected = selectedPosts.some(p => p.id === post.id);
    if (isSelected) {
      onSelectPosts(selectedPosts.filter(p => p.id !== post.id));
    } else {
      onSelectPosts([...selectedPosts, post]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      onSelectPosts([]);
    } else {
      onSelectPosts([...posts]);
    }
  };

  const isPostSelected = (post) => selectedPosts.some(p => p.id === post.id);

  const openPostModal = (post) => {
    setModalPost(post);
  };

  const closePostModal = () => {
    setModalPost(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="card animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-secondary-200 rounded-xl w-3/4"></div>
                <div className="h-4 bg-secondary-200 rounded-lg w-full"></div>
                <div className="h-4 bg-secondary-200 rounded-lg w-2/3"></div>
              </div>
              <div className="w-6 h-6 bg-secondary-200 rounded-lg ml-4"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
                <div className="h-3 bg-secondary-200 rounded w-16"></div>
                <div className="h-3 bg-secondary-200 rounded w-20"></div>
                <div className="h-3 bg-secondary-200 rounded w-24"></div>
              </div>
              <div className="h-3 bg-secondary-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-purple rounded-2xl blur opacity-20"></div>
          <div className="relative bg-gradient-to-r from-primary-500 to-accent-purple p-3 rounded-2xl">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gradient-primary mb-3">
          Select Questions to Answer
        </h2>
        <p className="text-secondary-600 text-lg mb-6">
          Found <span className="font-semibold text-primary-600">{posts.length}</span> quality question posts •
          <span className="font-semibold text-accent-purple"> {selectedPosts.length}</span> selected
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl border" style={{
        backgroundColor: isDark ? '#161b22' : '#f8fafc',
        borderColor: isDark ? '#30363d' : '#e5e7eb'
      }}>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: isDark ? '#21262d' : '#ffffff',
              borderColor: isDark ? '#30363d' : '#d1d5db',
              color: isDark ? '#f0f6fc' : '#374151'
            }}
          >
            {selectedPosts.length === posts.length ? (
              <>
                <Square className="h-4 w-4" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                <span>Select All</span>
              </>
            )}
          </button>

          <div className="text-sm" style={{color: isDark ? '#8b949e' : '#6b7280'}}>
            {selectedPosts.length} of {posts.length} posts selected
          </div>
        </div>

        {/* Generate Button - Always Visible */}
        <button
          onClick={() => {
            if (selectedPosts.length > 0 && onGenerate) {
              onGenerate();
            }
          }}
          disabled={selectedPosts.length === 0 || isLoading}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            selectedPosts.length > 0 && !isLoading
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transform hover:scale-105'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span>
            {isLoading
              ? 'Generating...'
              : `Generate Solutions (${selectedPosts.length})`
            }
          </span>
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {posts.map((post, index) => {
          const isSelected = isPostSelected(post);
          return (
            <div
              key={post.id}
              onClick={() => handlePostToggle(post)}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg group
                ${isSelected
                  ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
                }
              `}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold leading-tight mb-2" style={{
                    color: isDark ? '#f0f6fc' : '#111827'
                  }}>
                    {post.title}
                  </h3>
                </div>

                {/* Selection Indicator */}
                <div className="flex-shrink-0 ml-4">
                  {isSelected ? (
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <CheckSquare className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="p-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg group-hover:border-blue-400 transition-colors">
                      <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Post Content */}
              {post.body && (
                <div className="mb-4 p-4 rounded-lg border" style={{
                  backgroundColor: isDark ? '#0d1117' : '#f8fafc',
                  borderColor: isDark ? '#21262d' : '#e5e7eb'
                }}>
                  <p className="text-sm leading-relaxed" style={{
                    color: isDark ? '#8b949e' : '#6b7280'
                  }}>
                    {truncateText(post.body, 150)}
                  </p>

                  {post.body.length > 150 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPostModal(post);
                      }}
                      className="mt-3 flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Show Full Post</span>
                    </button>
                  )}
                </div>
              )}

              {/* Card Footer */}
              <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t" style={{
                borderColor: isDark ? '#21262d' : '#e5e7eb'
              }}>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" style={{color: isDark ? '#8b949e' : '#64748b'}} />
                    <span style={{color: isDark ? '#8b949e' : '#6b7280'}}>u/{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 font-medium">{post.score}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-600 font-medium">{post.numComments}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" style={{color: isDark ? '#8b949e' : '#64748b'}} />
                    <span style={{color: isDark ? '#8b949e' : '#6b7280'}}>{formatTimeAgo(post.created)}</span>
                  </div>

                  {/* Bookmark Button */}
                  <div onClick={(e) => e.stopPropagation()}>
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
              </div>
            </div>
          );
        })}
      </div>

      {selectedPosts.length > 0 && (
        <div className="mt-8 bg-gradient-to-br from-primary-50/80 via-white/80 to-accent-purple/5 backdrop-blur-sm border border-primary-200/50 rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-purple rounded-lg blur opacity-20"></div>
              <div className="relative bg-gradient-to-r from-primary-500 to-accent-purple p-2 rounded-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
            </div>
            <h3 className="ml-3 text-lg font-semibold text-primary-900">
              Selected {selectedPosts.length} Question{selectedPosts.length !== 1 ? 's' : ''}
            </h3>
          </div>

          <div className="space-y-2 mb-4">
            {selectedPosts.slice(0, 3).map((post, index) => (
              <div key={post.id} className="flex items-center bg-white/60 rounded-lg p-3 border border-primary-200/30">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3 flex-shrink-0"></div>
                <p className="text-primary-800 text-sm font-medium line-clamp-2">
                  {post.title}
                </p>
              </div>
            ))}
            {selectedPosts.length > 3 && (
              <div className="flex items-center bg-white/60 rounded-lg p-3 border border-primary-200/30">
                <div className="w-2 h-2 bg-accent-purple rounded-full mr-3 flex-shrink-0"></div>
                <p className="text-primary-700 text-sm font-medium">
                  ... and {selectedPosts.length - 3} more question{selectedPosts.length - 3 !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white/80 rounded-xl p-4 border border-primary-200/50">
            <p className="text-primary-700 text-sm font-medium">
              🚀 Ready to generate AI-powered solutions for {selectedPosts.length === 1 ? 'this question' : 'these questions'} using Google Gemini AI.
            </p>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {modalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div
            className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-lg shadow-2xl"
            style={{
              backgroundColor: isDark ? '#161b22' : '#ffffff',
              border: `1px solid ${isDark ? '#30363d' : '#d1d5db'}`,
              opacity: '1 !important'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-4 border-b" style={{
              borderColor: isDark ? '#30363d' : '#e5e7eb',
              backgroundColor: isDark ? '#161b22' : '#ffffff'
            }}>
              <div className="flex-1 pr-4">
                <h2 className="text-lg font-semibold leading-tight mb-3" style={{
                  color: isDark ? '#f0f6fc' : '#111827'
                }}>
                  {modalPost.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" style={{color: isDark ? '#8b949e' : '#64748b'}} />
                    <span style={{color: isDark ? '#8b949e' : '#6b7280'}}>u/{modalPost.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" style={{color: isDark ? '#8b949e' : '#64748b'}} />
                    <span style={{color: isDark ? '#8b949e' : '#6b7280'}}>{formatTimeAgo(modalPost.created)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600 font-medium">{modalPost.score}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-600 font-medium">{modalPost.numComments}</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={closePostModal}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" style={{color: isDark ? '#8b949e' : '#6b7280'}} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(85vh-160px)]" style={{
              backgroundColor: isDark ? '#161b22' : '#ffffff'
            }}>
              <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{
                color: isDark ? '#8b949e' : '#374151'
              }}>
                {modalPost.body}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t" style={{
              borderColor: isDark ? '#30363d' : '#e5e7eb',
              backgroundColor: isDark ? '#161b22' : '#ffffff'
            }}>
              <div className="flex items-center space-x-3">
                <BookmarkPostButton
                  title={modalPost.title}
                  subreddit={modalPost.subreddit}
                  postId={modalPost.id}
                  url={modalPost.url}
                  category="Reddit Posts"
                  size="sm"
                  showText={true}
                />
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={modalPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View on Reddit</span>
                </a>

                <button
                  onClick={closePostModal}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostSelector;
