import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import User from '../models/User.js';

/**
 * Verifies JWT from Authorization header and attaches user to req.
 * Always fetches fresh user data from database to get latest roles.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'Authentication required. Please provide a valid token.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data from database (includes latest roles)
    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) {
      throw createError(401, 'User not found. Token may be invalid.');
    }

    // Use fresh database data (not token data) for roles
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Invalid token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token has expired. Please log in again.'));
    }
    next(error);
  }
};

/**
 * Checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER authenticate middleware.
 * Now supports users with multiple roles - checks both 'role' and 'roles' array.
 *
 * @param  {...string} roles - Allowed roles (e.g., 'student', 'instructor')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required.'));
    }

    // Check if user has any role set (backward compatible)
    const hasRole = req.user.role || (req.user.roles && req.user.roles.length > 0);
    if (!hasRole) {
      return next(createError(403, 'Please select a role before accessing this resource.'));
    }

    // Check if user has at least one of the required roles
    // Support both single role (backward compat) and multiple roles (new)
    const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
    const hasRequiredRole = userRoles.some(userRole => roles.includes(userRole));

    if (!hasRequiredRole) {
      return next(
        createError(403, `Access denied. Required role: ${roles.join(' or ')}.`)
      );
    }

    next();
  };
};

/**
 * Allows only users with the 'admin' role.
 * Must be used AFTER authenticate middleware.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(createError(401, 'Authentication required.'));
  }
  const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
  if (!userRoles.includes('admin')) {
    return next(createError(403, 'Admin access required.'));
  }
  next();
};

/**
 * Generates a JWT token for the given user.
 * Includes both role (primary) and roles array (multi-role support).
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      roles: user.roles || (user.role ? [user.role] : [])
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};
