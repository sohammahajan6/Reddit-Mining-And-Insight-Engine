const { db } = require('../config/database');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class UserRepository {
  constructor() {
    this.tableName = 'users';
  }

  /**
   * Initialize the repository (PostgreSQL doesn't need initialization)
   */
  async initialize() {
    try {
      // Test database connection
      await db.raw('SELECT 1');
      console.log('✅ UserRepository initialized with PostgreSQL');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize UserRepository:', error.message);
      return false;
    }
  }

  /**
   * Convert database row to User model
   */
  rowToUser(row) {
    if (!row) return null;

    return new User({
      id: row.id,
      email: row.email,
      username: row.username,
      password: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      bio: row.bio,
      location: row.location,
      website: row.website,
      avatar: row.avatar_url,
      role: row.role,
      isActive: row.is_active,
      preferences: row.preferences,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
      emailVerified: row.email_verified,
      stats: row.stats
    });
  }

  /**
   * Convert User model to database row
   */
  userToRow(user) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      password_hash: user.password,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone || null,
      bio: user.bio || null,
      location: user.location || null,
      website: user.website || null,
      avatar_url: user.avatar || null,
      role: user.role,
      is_active: user.isActive,
      preferences: JSON.stringify(user.preferences),
      email_verified: user.emailVerified,
      stats: JSON.stringify(user.stats),
      last_login_at: user.lastLoginAt
    };
  }

  /**
   * Create a new user
   */
  async create(userData) {
    try {
      // Generate ID if not provided
      if (!userData.id) {
        userData.id = uuidv4();
      }

      const user = new User(userData);

      // Validate user data
      const validation = user.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check if email or username already exists
      const existingEmail = await this.findByEmail(user.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }

      const existingUsername = await this.findByUsername(user.username);
      if (existingUsername) {
        throw new Error('Username already exists');
      }

      // Hash password
      await user.hashPassword();

      // Convert to database row format
      const row = this.userToRow(user);

      // Insert into database
      const [insertedUser] = await db(this.tableName)
        .insert(row)
        .returning('*');

      console.log(`✅ Created user: ${user.username} (${user.email})`);
      return this.rowToUser(insertedUser);
    } catch (error) {
      console.error('❌ Failed to create user:', error.message);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      const row = await db(this.tableName)
        .where({ id })
        .whereNull('deleted_at')
        .first();

      return this.rowToUser(row);
    } catch (error) {
      console.error('❌ Failed to find user by ID:', error.message);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    try {
      const row = await db(this.tableName)
        .whereRaw('LOWER(email) = LOWER(?)', [email])
        .whereNull('deleted_at')
        .first();

      return this.rowToUser(row);
    } catch (error) {
      console.error('❌ Failed to find user by email:', error.message);
      throw error;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username) {
    try {
      const row = await db(this.tableName)
        .whereRaw('LOWER(username) = LOWER(?)', [username])
        .whereNull('deleted_at')
        .first();

      return this.rowToUser(row);
    } catch (error) {
      console.error('❌ Failed to find user by username:', error.message);
      throw error;
    }
  }

  /**
   * Update user
   */
  async update(id, updates) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Update user properties
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          user[key] = updates[key];
        }
      });

      // Hash password if updated
      if (updates.password) {
        await user.hashPassword();
        updates.password = user.password; // Use hashed password
      }

      // Convert updates to database format
      const dbUpdates = {};
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.password !== undefined) dbUpdates.password_hash = updates.password;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.preferences !== undefined) dbUpdates.preferences = JSON.stringify(updates.preferences);
      if (updates.emailVerified !== undefined) dbUpdates.email_verified = updates.emailVerified;
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.website !== undefined) dbUpdates.website = updates.website;
      if (updates.socialLinks !== undefined) dbUpdates.social_links = JSON.stringify(updates.socialLinks);
      if (updates.stats !== undefined) dbUpdates.stats = JSON.stringify(updates.stats);
      if (updates.lastLoginAt !== undefined) dbUpdates.last_login_at = updates.lastLoginAt;

      // Add updated_at timestamp
      dbUpdates.updated_at = new Date();

      // Update in database
      const [updatedRow] = await db(this.tableName)
        .where({ id })
        .update(dbUpdates)
        .returning('*');

      console.log(`✅ Updated user: ${user.username}`);
      return this.rowToUser(updatedRow);
    } catch (error) {
      console.error('❌ Failed to update user:', error.message);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete by setting deleted_at timestamp
      await db(this.tableName)
        .where({ id })
        .update({
          deleted_at: new Date(),
          updated_at: new Date()
        });

      console.log(`✅ Deleted user: ${user.username}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete user:', error.message);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async findAll(filters = {}) {
    try {
      let query = db(this.tableName)
        .whereNull('deleted_at');

      // Apply filters
      if (filters.role) {
        query = query.where('role', filters.role);
      }

      if (filters.isActive !== undefined) {
        query = query.where('is_active', filters.isActive);
      }

      if (filters.search) {
        const search = `%${filters.search.toLowerCase()}%`;
        query = query.where(function() {
          this.whereRaw('LOWER(username) LIKE ?', [search])
            .orWhereRaw('LOWER(email) LIKE ?', [search])
            .orWhereRaw('LOWER(first_name) LIKE ?', [search])
            .orWhereRaw('LOWER(last_name) LIKE ?', [search]);
        });
      }

      // Add ordering
      query = query.orderBy('created_at', 'desc');

      const rows = await query;
      return rows.map(row => this.rowToUser(row));
    } catch (error) {
      console.error('❌ Failed to find all users:', error.message);
      throw error;
    }
  }

  /**
   * Get user count
   */
  async count() {
    try {
      const result = await db(this.tableName)
        .whereNull('deleted_at')
        .count('id as count')
        .first();

      return parseInt(result.count);
    } catch (error) {
      console.error('❌ Failed to count users:', error.message);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async findByRole(role) {
    try {
      const rows = await db(this.tableName)
        .where('role', role)
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc');

      return rows.map(row => this.rowToUser(row));
    } catch (error) {
      console.error('❌ Failed to find users by role:', error.message);
      throw error;
    }
  }

  /**
   * Update user stats
   */
  async updateStats(id, stats) {
    try {
      const user = await this.findById(id);
      if (!user) {
        return null;
      }

      user.updateStats(stats);
      return await this.update(id, { stats: user.stats });
    } catch (error) {
      console.error('❌ Failed to update user stats:', error.message);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(id, preferences) {
    try {
      const user = await this.findById(id);
      if (!user) {
        return null;
      }

      user.updatePreferences(preferences);
      return await this.update(id, { preferences: user.preferences });
    } catch (error) {
      console.error('❌ Failed to update user preferences:', error.message);
      throw error;
    }
  }
}

module.exports = UserRepository;
