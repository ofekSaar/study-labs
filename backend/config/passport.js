import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

/**
 * Configures all Passport authentication strategies.
 * 
 * Architecture: Each OAuth provider is a separate Passport strategy.
 * To add a new provider (e.g. GitHub, Facebook):
 *   1. npm install passport-<provider>
 *   2. Add a new strategy block below following the same pattern
 *   3. Add the corresponding routes in routes/auth.js
 */
const configurePassport = () => {
  // ── Google OAuth Strategy ──────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Google rotates these URLs, so re-read it on every login rather than
            // trusting whatever was stored the first time round.
            const photoUrl = profile.photos?.[0]?.value || null;

            // Find existing user or create new one
            let user = await User.findOne({
              provider: 'google',
              providerId: profile.id,
            });

            if (!user) {
              // Check if email already exists (linked to another provider)
              user = await User.findOne({ email: profile.emails?.[0]?.value });

              if (user) {
                // Link Google to existing account
                user.provider = 'google';
                user.providerId = profile.id;
              } else {
                // Create brand new user
                user = new User({
                  provider: 'google',
                  providerId: profile.id,
                  name: profile.displayName,
                  email: profile.emails?.[0]?.value,
                  role: null, // Will be set on first role selection
                });
              }
            }

            if (user.photoUrl !== photoUrl) {
              user.photoUrl = photoUrl;
            }

            // Accounts created before `photoUrl` existed kept the Google URL in
            // `avatar`, which is now emoji-only. Clear it so it can't reach an <img>.
            if (typeof user.avatar === 'string' && /^https?:\/\//.test(user.avatar)) {
              user.avatar = null;
            }

            if (user.isNew || user.isModified()) {
              await user.save();
            }

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  // ── Add more strategies here ───────────────────────────
  // Example: GitHub OAuth
  // if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  //   passport.use(new GitHubStrategy({ ... }, async (...) => { ... }));
  // }

  // Serialize/Deserialize (only needed for session-based auth, not JWT)
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default configurePassport;
