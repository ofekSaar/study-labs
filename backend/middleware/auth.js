import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import User from '../models/User.js';

/**
 * Verifies JWT from Authorization header and attaches user to req.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError(401, 'Authentication required. Please provide a valid token.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-__v');
    if (!user) {
      throw createError(401, 'User not found. Token may be invalid.');
    }

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
 * 
 * @param  {...string} roles - Allowed roles (e.g., 'student', 'instructor')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(createError(401, 'Authentication required.'));
    }

    if (!req.user.role) {
      return next(createError(403, 'Please select a role before accessing this resource.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, `Access denied. Required role: ${roles.join(' or ')}.`)
      );
    }

    next();
  };
};

/**
 * Generates a JWT token for the given user.
 */
export const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};
