import { apiRequest } from './api';
import toast from 'react-hot-toast';

/**
 * Get all bookmarks for the current user
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Bookmarks data with pagination
 */
export const getBookmarks = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await apiRequest.get(`/bookmarks?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('Get bookmarks error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch bookmarks');
  }
};

/**
 * Create a new bookmark
 * @param {Object} bookmarkData - Bookmark data
 * @returns {Promise<Object>} Created bookmark
 */
export const createBookmark = async (bookmarkData) => {
  try {
    toast.loading('Saving bookmark...', { id: 'bookmark-create' });
    
    const response = await apiRequest.post('/bookmarks', bookmarkData);
    
    toast.success('Bookmark saved successfully!', { id: 'bookmark-create' });
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to save bookmark';
    toast.error(message, { id: 'bookmark-create' });
    throw new Error(message);
  }
};

/**
 * Update an existing bookmark
 * @param {string} id - Bookmark ID
 * @param {Object} updateData - Updated bookmark data
 * @returns {Promise<Object>} Updated bookmark
 */
export const updateBookmark = async (id, updateData) => {
  try {
    toast.loading('Updating bookmark...', { id: 'bookmark-update' });
    
    const response = await apiRequest.put(`/bookmarks/${id}`, updateData);
    
    toast.success('Bookmark updated successfully!', { id: 'bookmark-update' });
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update bookmark';
    toast.error(message, { id: 'bookmark-update' });
    throw new Error(message);
  }
};

/**
 * Delete a bookmark
 * @param {string} id - Bookmark ID
 * @returns {Promise<void>}
 */
export const deleteBookmark = async (id) => {
  try {
    toast.loading('Deleting bookmark...', { id: 'bookmark-delete' });
    
    await apiRequest.delete(`/bookmarks/${id}`);
    
    toast.success('Bookmark deleted successfully!', { id: 'bookmark-delete' });
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to delete bookmark';
    toast.error(message, { id: 'bookmark-delete' });
    throw new Error(message);
  }
};

/**
 * Get bookmark categories for the current user
 * @returns {Promise<Array>} Array of category names
 */
export const getCategories = async () => {
  try {
    const response = await apiRequest.get('/bookmarks/categories');
    return response.data.data;
  } catch (error) {
    console.error('Get categories error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch categories');
  }
};

/**
 * Get bookmark statistics for the current user
 * @returns {Promise<Object>} Bookmark statistics
 */
export const getBookmarkStats = async () => {
  try {
    const response = await apiRequest.get('/bookmarks/stats');
    return response.data.data;
  } catch (error) {
    console.error('Get bookmark stats error:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch bookmark statistics');
  }
};

/**
 * Toggle bookmark favorite status
 * @param {string} id - Bookmark ID
 * @param {boolean} isFavorite - New favorite status
 * @returns {Promise<Object>} Updated bookmark
 */
export const toggleFavorite = async (id, isFavorite) => {
  try {
    const response = await apiRequest.put(`/bookmarks/${id}`, { is_favorite: isFavorite });
    
    toast.success(isFavorite ? 'Added to favorites!' : 'Removed from favorites!');
    return response.data.data;
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to update favorite status';
    toast.error(message);
    throw new Error(message);
  }
};

/**
 * Bookmark a solution from the main app
 * @param {Object} solutionData - Solution data to bookmark
 * @returns {Promise<Object>} Created bookmark
 */
export const bookmarkSolution = async (solutionData) => {
  const {
    title,
    content,
    subreddit,
    postUrl,
    template,
    tone,
    length,
    category = 'Solutions'
  } = solutionData;

  const bookmarkData = {
    title: title || 'AI Generated Solution',
    description: `Solution for ${subreddit ? `r/${subreddit}` : 'Reddit post'}`,
    type: 'solution',
    subreddit,
    post_url: postUrl,
    solution_content: content,
    solution_template: template,
    solution_tone: tone,
    solution_length: length,
    category,
    tags: [subreddit, template, tone].filter(Boolean)
  };

  return createBookmark(bookmarkData);
};

/**
 * Bookmark a Reddit post
 * @param {Object} postData - Reddit post data to bookmark
 * @returns {Promise<Object>} Created bookmark
 */
export const bookmarkPost = async (postData) => {
  const {
    title,
    subreddit,
    postId,
    url,
    category = 'Posts'
  } = postData;

  const bookmarkData = {
    title,
    description: `Reddit post from r/${subreddit}`,
    type: 'post',
    subreddit,
    post_id: postId,
    post_title: title,
    post_url: url,
    category,
    tags: [subreddit, 'reddit-post'].filter(Boolean)
  };

  return createBookmark(bookmarkData);
};

/**
 * Bookmark an external link
 * @param {Object} linkData - External link data to bookmark
 * @returns {Promise<Object>} Created bookmark
 */
export const bookmarkLink = async (linkData) => {
  const {
    title,
    description,
    url,
    category = 'Links',
    tags = []
  } = linkData;

  const bookmarkData = {
    title,
    description,
    type: 'external',
    external_url: url,
    category,
    tags: [...tags, 'external-link']
  };

  return createBookmark(bookmarkData);
};

/**
 * Search bookmarks
 * @param {string} query - Search query
 * @param {Object} filters - Additional filters
 * @returns {Promise<Object>} Search results
 */
export const searchBookmarks = async (query, filters = {}) => {
  return getBookmarks({
    search: query,
    ...filters
  });
};

/**
 * Export bookmarks to JSON
 * @param {Object} filters - Export filters
 * @returns {Promise<string>} JSON string of bookmarks
 */
export const exportBookmarks = async (filters = {}) => {
  try {
    const data = await getBookmarks({ ...filters, limit: 1000 });
    return JSON.stringify(data.bookmarks, null, 2);
  } catch (error) {
    toast.error('Failed to export bookmarks');
    throw error;
  }
};

export default {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  getCategories,
  getBookmarkStats,
  toggleFavorite,
  bookmarkSolution,
  bookmarkPost,
  bookmarkLink,
  searchBookmarks,
  exportBookmarks
};
