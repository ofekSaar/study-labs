import passport from 'passport';
import createError from 'http-errors';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

/**
 * Initiates Google OAuth flow.
 * If Google credentials are not configured, use mock login for local development.
 */
export const googleAuth = (req, res, next) => {
  const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

  if (!hasGoogleCreds) {
    // Mock login for local development
    return mockLogin(req, res, next);
  }

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
};

/**
 * Mock login for local development (no Google credentials required).
 * Creates or finds a dev user and returns a JWT token.
 */
const mockLogin = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return next(createError(404, 'Not found'));
    }

    const DEV_EMAIL = 'dev@studylabs.local';
    let user = await User.findOne({ email: DEV_EMAIL });

    if (!user) {
      user = await User.create({
        provider: 'local',
        providerId: 'mock-dev-user',
        name: 'Dev User',
        email: DEV_EMAIL,
        photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dev',
        role: 'instructor',
        roles: ['instructor', 'student'],
      });
    }

    const token = generateToken(user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth callback handler.
 * Issues JWT token and redirects to frontend.
 */
export const googleCallback = (req, res, next) => {
  const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

  if (!hasGoogleCreds) {
    return mockLogin(req, res, next);
  }

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
    // Check if role is already set to prevent changing it
    if (req.user.role || (req.user.roles && req.user.roles.length > 0)) {
      throw createError(400, 'Role already set');
    }

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

/**
 * Update authenticated user's profile fields.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) {
      // `avatar` is the cosmetic emoji picker only — the provider photo lives in
      // `photoUrl` and is not user-editable.
      if (typeof avatar === 'string' && /^https?:\/\//.test(avatar)) {
        throw createError(400, 'avatar must be an emoji, not a URL');
      }
      updates.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );

    res.json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

