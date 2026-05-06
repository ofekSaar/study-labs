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
 * Now supports multiple roles - user can be both student and instructor.
 */
export const setRole = async (req, res, next) => {
  try {
    const { role, roles } = req.body;

    // Support both single role and multiple roles
    let rolesToSet = [];
    if (roles && Array.isArray(roles)) {
      rolesToSet = roles;
    } else if (role) {
      rolesToSet = [role];
    }

    // Validate roles
    const validRoles = ['student', 'instructor'];
    const invalidRoles = rolesToSet.filter(r => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      throw createError(400, `Invalid role(s): ${invalidRoles.join(', ')}. Must be "student" or "instructor".`);
    }

    if (rolesToSet.length === 0) {
      throw createError(400, 'At least one role must be provided.');
    }

    // Get unique roles
    const uniqueRoles = [...new Set(rolesToSet)];

    // Determine primary role (for backward compatibility)
    // Priority: instructor > student
    const primaryRole = uniqueRoles.includes('instructor') ? 'instructor' : 'student';

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        roles: uniqueRoles,
        role: primaryRole
      },
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
