import React, { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as bookmarkService from '../services/bookmarkService';

const BookmarkButton = ({ 
  solutionData, 
  postData, 
  linkData, 
  className = '',
  size = 'sm',
  showText = false,
  onBookmarked = null
}) => {
  const { isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const iconSize = size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      alert('Please login to bookmark items');
      return;
    }

    try {
      setIsLoading(true);
      let bookmark;

      if (solutionData) {
        bookmark = await bookmarkService.bookmarkSolution(solutionData);
      } else if (postData) {
        bookmark = await bookmarkService.bookmarkPost(postData);
      } else if (linkData) {
        bookmark = await bookmarkService.bookmarkLink(linkData);
      } else {
        throw new Error('No data provided for bookmarking');
      }

      setIsBookmarked(true);
      
      if (onBookmarked) {
        onBookmarked(bookmark);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      // Error is already handled by the service with toast
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show bookmark button if not logged in
  }

  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading || isBookmarked}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
        ${isBookmarked 
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
          : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        ${className}
      `}
      title={isBookmarked ? 'Bookmarked!' : 'Save to bookmarks'}
    >
      {isBookmarked ? (
        <BookmarkCheck className={iconSize} />
      ) : (
        <Bookmark className={iconSize} />
      )}
      
      {showText && (
        <span className="text-sm font-medium">
          {isLoading ? 'Saving...' : isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </button>
  );
};

// Specific bookmark button for solutions
export const BookmarkSolutionButton = ({ 
  title, 
  content, 
  subreddit, 
  postUrl, 
  template, 
  tone, 
  length,
  category,
  ...props 
}) => {
  const solutionData = {
    title,
    content,
    subreddit,
    postUrl,
    template,
    tone,
    length,
    category
  };

  return <BookmarkButton solutionData={solutionData} {...props} />;
};

// Specific bookmark button for Reddit posts
export const BookmarkPostButton = ({ 
  title, 
  subreddit, 
  postId, 
  url,
  category,
  ...props 
}) => {
  const postData = {
    title,
    subreddit,
    postId,
    url,
    category
  };

  return <BookmarkButton postData={postData} {...props} />;
};

// Specific bookmark button for external links
export const BookmarkLinkButton = ({ 
  title, 
  description, 
  url,
  category,
  tags,
  ...props 
}) => {
  const linkData = {
    title,
    description,
    url,
    category,
    tags
  };

  return <BookmarkButton linkData={linkData} {...props} />;
};

export default BookmarkButton;
