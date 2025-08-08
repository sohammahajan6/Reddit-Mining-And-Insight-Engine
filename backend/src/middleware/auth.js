const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');

const userRepository = new UserRepository();

/**
 * Middleware to authenticate JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await userRepository.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware to check if user has specific permission
 */
const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roleArray.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (!req.user.isAdmin()) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  next();
};



/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepository.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Middleware to check if user owns the resource
 */
const requireOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const resourceId = req.params[resourceIdParam];
    
    // Admin can access any resource
    if (req.user.isAdmin()) {
      return next();
    }

    // Check if user owns the resource
    if (req.user.id !== resourceId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied - resource ownership required'
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    
    // Clean old attempts
    for (const [k, v] of attempts.entries()) {
      if (now - v.firstAttempt > windowMs) {
        attempts.delete(k);
      }
    }
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts) {
      attempts.set(key, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }
    
    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000)
      });
    }
    
    userAttempts.count++;
    next();
  };
};

/**
 * Extract token from request headers
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
}

/**
 * Middleware to validate API key for external access
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
};

/**
 * Middleware to log authentication events
 */
const logAuthEvent = (event) => {
  return (req, res, next) => {
    const logData = {
      event,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      username: req.user?.username
    };
    
    console.log(`🔐 Auth Event: ${event}`, logData);
    
    // TODO: Store in audit log
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireRole,
  requireAdmin,

  optionalAuth,
  requireOwnership,
  authRateLimit,
  validateApiKey,
  logAuthEvent
};
