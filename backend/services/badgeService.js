import BADGES from '../constants/badges.js';

/**
 * Evaluate which badges a stats snapshot newly unlocks.
 *
 * @param {object} stats          - User.stats (lessons_completed, streak, level, total_xp, ...)
 * @param {string[]} alreadyUnlocked - badge ids the user already owns
 * @returns {string[]} ids of badges newly earned (not previously owned)
 */
export const evaluateNewBadges = (stats = {}, alreadyUnlocked = []) => {
  const owned = new Set(alreadyUnlocked);
  const newlyEarned = [];

  for (const badge of BADGES) {
    if (owned.has(badge.id)) continue;
    const value = stats[badge.condition] ?? 0;
    if (value >= badge.threshold) {
      newlyEarned.push(badge.id);
    }
  }

  return newlyEarned;
};

export default evaluateNewBadges;
