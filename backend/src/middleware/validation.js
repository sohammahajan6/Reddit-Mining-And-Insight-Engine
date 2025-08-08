/**
 * Validation middleware for various endpoints
 */

/**
 * Validate user registration
 */
const validateRegistration = (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  const errors = [];

  // Username validation
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }
  if (username && username.length > 50) {
    errors.push('Username must be less than 50 characters');
  }
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Email validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Name validation
  if (firstName && firstName.length > 100) {
    errors.push('First name must be less than 100 characters');
  }
  if (lastName && lastName.length > 100) {
    errors.push('Last name must be less than 100 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate user login
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  }
  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate profile update
 */
const validateProfileUpdate = (req, res, next) => {
  const { username, email, firstName, lastName, bio } = req.body;
  const errors = [];

  // Username validation (if provided)
  if (username !== undefined) {
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 50) {
      errors.push('Username must be less than 50 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
  }

  // Email validation (if provided)
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Valid email is required');
  }

  // Name validation
  if (firstName !== undefined && firstName.length > 100) {
    errors.push('First name must be less than 100 characters');
  }
  if (lastName !== undefined && lastName.length > 100) {
    errors.push('Last name must be less than 100 characters');
  }
  if (bio !== undefined && bio.length > 500) {
    errors.push('Bio must be less than 500 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate password change
 */
const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required');
  }
  if (!newPassword || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Validate bookmark creation/update
 */
const validateBookmark = (req, res, next) => {
  const {
    title,
    type,
    solution_template,
    solution_tone,
    solution_length,
    tags
  } = req.body;

  const errors = [];

  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required');
  } else if (title.length > 500) {
    errors.push('Title must be less than 500 characters');
  }

  // Validate type
  if (type && !['solution', 'post', 'external'].includes(type)) {
    errors.push('Type must be one of: solution, post, external');
  }

  // Validate solution template
  if (solution_template && !['general', 'relationship', 'career', 'technical', 'social'].includes(solution_template)) {
    errors.push('Solution template must be one of: general, relationship, career, technical, social');
  }

  // Validate solution tone
  if (solution_tone && !['empathetic', 'professional', 'casual', 'direct'].includes(solution_tone)) {
    errors.push('Solution tone must be one of: empathetic, professional, casual, direct');
  }

  // Validate solution length
  if (solution_length && !['short', 'medium', 'detailed'].includes(solution_length)) {
    errors.push('Solution length must be one of: short, medium, detailed');
  }

  // Validate tags
  if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string'))) {
    errors.push('Tags must be an array of strings');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateBookmark
};
