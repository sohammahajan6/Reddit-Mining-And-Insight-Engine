const express = require('express');
const router = express.Router();
const {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  getCategories,
  getStats
} = require('../controllers/bookmarkController');
const { authenticate } = require('../middleware/auth');
// const { validateBookmark } = require('../middleware/validation');

// Apply authentication to all bookmark routes
router.use(authenticate);

/**
 * @route   GET /api/bookmarks/categories
 * @desc    Get all categories for authenticated user
 * @access  Private
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/bookmarks/stats
 * @desc    Get bookmark statistics for authenticated user
 * @access  Private
 */
router.get('/stats', getStats);

/**
 * @route   GET /api/bookmarks
 * @desc    Get all bookmarks for authenticated user
 * @access  Private
 * @query   {string} type - Filter by bookmark type (solution, post, external)
 * @query   {string} category - Filter by category
 * @query   {string} subreddit - Filter by subreddit
 * @query   {boolean} is_favorite - Filter by favorite status
 * @query   {string} search - Search in title, description, content, notes
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @query   {string} sort_by - Sort field (default: created_at)
 * @query   {string} sort_order - Sort order (asc/desc, default: desc)
 */
router.get('/', getBookmarks);

/**
 * @route   POST /api/bookmarks
 * @desc    Create a new bookmark
 * @access  Private
 * @body    {object} bookmark - Bookmark data
 */
router.post('/', createBookmark);

/**
 * @route   PUT /api/bookmarks/:id
 * @desc    Update a bookmark
 * @access  Private
 * @param   {string} id - Bookmark ID
 * @body    {object} bookmark - Updated bookmark data
 */
router.put('/:id', updateBookmark);

/**
 * @route   DELETE /api/bookmarks/:id
 * @desc    Delete a bookmark
 * @access  Private
 * @param   {string} id - Bookmark ID
 */
router.delete('/:id', deleteBookmark);

module.exports = router;
