const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all bookmarks for a user
 */
const getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      type, 
      category, 
      subreddit, 
      is_favorite, 
      search,
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    let query = db('bookmarks')
      .where('user_id', userId)
      .select('*');

    // Apply filters
    if (type) {
      query = query.where('type', type);
    }
    if (category) {
      query = query.where('category', category);
    }
    if (subreddit) {
      query = query.where('subreddit', subreddit);
    }
    if (is_favorite !== undefined) {
      query = query.where('is_favorite', is_favorite === 'true');
    }
    if (search) {
      query = query.where(function() {
        this.where('title', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`)
            .orWhere('solution_content', 'ilike', `%${search}%`)
            .orWhere('notes', 'ilike', `%${search}%`);
      });
    }

    // Apply sorting
    query = query.orderBy(sort_by, sort_order);

    // Apply pagination
    const offset = (page - 1) * limit;
    const bookmarks = await query.limit(limit).offset(offset);

    // Get total count for pagination
    const totalQuery = db('bookmarks').where('user_id', userId);
    if (type) totalQuery.where('type', type);
    if (category) totalQuery.where('category', category);
    if (subreddit) totalQuery.where('subreddit', subreddit);
    if (is_favorite !== undefined) totalQuery.where('is_favorite', is_favorite === 'true');
    if (search) {
      totalQuery.where(function() {
        this.where('title', 'ilike', `%${search}%`)
            .orWhere('description', 'ilike', `%${search}%`)
            .orWhere('solution_content', 'ilike', `%${search}%`)
            .orWhere('notes', 'ilike', `%${search}%`);
      });
    }
    
    const [{ count: total }] = await totalQuery.count('id as count');

    res.json({
      success: true,
      data: {
        bookmarks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmarks'
    });
  }
};

/**
 * Create a new bookmark
 */
const createBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      type = 'solution',
      subreddit,
      post_id,
      post_title,
      post_url,
      solution_content,
      solution_template,
      solution_tone,
      solution_length,
      external_url,
      category,
      tags = [],
      is_favorite = false,
      is_private = false,
      notes
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    // Check for duplicate bookmark
    if (post_id && type) {
      const existing = await db('bookmarks')
        .where({ user_id: userId, post_id, type })
        .first();
      
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Bookmark already exists'
        });
      }
    }

    const bookmarkData = {
      id: uuidv4(),
      user_id: userId,
      title,
      description,
      type,
      subreddit,
      post_id,
      post_title,
      post_url,
      solution_content,
      solution_template,
      solution_tone,
      solution_length,
      external_url,
      category,
      tags: JSON.stringify(tags),
      is_favorite,
      is_private,
      notes,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [bookmark] = await db('bookmarks')
      .insert(bookmarkData)
      .returning('*');

    res.status(201).json({
      success: true,
      data: bookmark,
      message: 'Bookmark created successfully'
    });
  } catch (error) {
    console.error('Create bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bookmark'
    });
  }
};

/**
 * Update a bookmark
 */
const updateBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.created_at;
    
    updateData.updated_at = new Date();

    // Convert tags to JSON if provided
    if (updateData.tags) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    const [bookmark] = await db('bookmarks')
      .where({ id, user_id: userId })
      .update(updateData)
      .returning('*');

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    res.json({
      success: true,
      data: bookmark,
      message: 'Bookmark updated successfully'
    });
  } catch (error) {
    console.error('Update bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bookmark'
    });
  }
};

/**
 * Delete a bookmark
 */
const deleteBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const deleted = await db('bookmarks')
      .where({ id, user_id: userId })
      .del();

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found'
      });
    }

    res.json({
      success: true,
      message: 'Bookmark deleted successfully'
    });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bookmark'
    });
  }
};

/**
 * Get bookmark categories for a user
 */
const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const categories = await db('bookmarks')
      .where('user_id', userId)
      .whereNotNull('category')
      .distinct('category')
      .select('category')
      .orderBy('category');

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * Get bookmark statistics for a user
 */
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      totalCount,
      favoriteCount,
      typeStats,
      categoryStats
    ] = await Promise.all([
      db('bookmarks').where('user_id', userId).count('id as count').first(),
      db('bookmarks').where({ user_id: userId, is_favorite: true }).count('id as count').first(),
      db('bookmarks').where('user_id', userId).groupBy('type').select('type').count('id as count'),
      db('bookmarks').where('user_id', userId).whereNotNull('category').groupBy('category').select('category').count('id as count')
    ]);

    res.json({
      success: true,
      data: {
        total: parseInt(totalCount.count),
        favorites: parseInt(favoriteCount.count),
        byType: typeStats.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
        byCategory: categoryStats.reduce((acc, item) => {
          acc[item.category] = parseInt(item.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get bookmark stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookmark statistics'
    });
  }
};

module.exports = {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  getCategories,
  getStats
};
