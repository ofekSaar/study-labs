import passport from 'passport';
import createError from 'http-errors';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Initiates Google OAuth flow.
 * Passport handles the redirect to Google.
 */
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

/**
 * Google OAuth callback handler.
 * Issues JWT token and redirects to frontend.
 */
export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return next(createError(401, 'Authentication failed'));

    const token = generateToken(user);

    // Redirect to frontend with token
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  })(req, res, next);
};

/**
 * Get current authenticated user.
 */
export const getMe = async (req, res) => {
  res.json({
    status: 'success',
    data: { user: req.user },
  });
};

/**
 * Set user role (first-time login flow).
 */
export const setRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['student', 'instructor'].includes(role)) {
      throw createError(400, 'Invalid role. Must be "student" or "instructor".');
    }

    // Only allow setting role if not already set
    if (req.user.role) {
      throw createError(400, 'Role already set. Cannot change role.');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true }
    );

    // Generate new token with updated role
    const token = generateToken(user);

    res.json({
      status: 'success',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout (client-side token removal, server acknowledges).
 */
export const logout = (req, res) => {
  res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
};
