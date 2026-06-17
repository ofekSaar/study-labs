/**
 * BADGE DEFINITIONS (server copy)
 *
 * Mirrors frontend/src/utils/badges.js. The server owns badge unlocking so the
 * economy is authoritative; the frontend keeps its own copy purely for display
 * (icons, rarity, descriptions). Keep the two `id`/`condition`/`threshold`
 * tables in sync when adding badges.
 */
export const BADGES = [
  // First actions
  { id: 'first_lesson',    condition: 'lessons_completed', threshold: 1 },
  { id: 'first_perfect',   condition: 'perfect_quizzes',   threshold: 1 },
  { id: 'first_streak',    condition: 'streak',            threshold: 3 },

  // Speed & skill
  { id: 'speed_demon',     condition: 'fast_answers',      threshold: 1 },
  { id: 'no_mistakes_5',   condition: 'no_mistake_streak', threshold: 5 },
  { id: 'triple_perfect',  condition: 'perfect_quizzes',   threshold: 3 },

  // Streaks
  { id: 'streak_7',        condition: 'streak',            threshold: 7 },
  { id: 'streak_30',       condition: 'streak',            threshold: 30 },
  { id: 'streak_100',      condition: 'streak',            threshold: 100 },

  // XP & levels
  { id: 'level_5',         condition: 'level',             threshold: 5 },
  { id: 'level_10',        condition: 'level',             threshold: 10 },
  { id: 'level_25',        condition: 'level',             threshold: 25 },
  { id: 'xp_1000',         condition: 'total_xp',          threshold: 1000 },
  { id: 'xp_5000',         condition: 'total_xp',          threshold: 5000 },

  // Volume
  { id: 'lessons_10',      condition: 'lessons_completed', threshold: 10 },
  { id: 'lessons_50',      condition: 'lessons_completed', threshold: 50 },

  // Special
  { id: 'night_owl',       condition: 'night_study',       threshold: 1 },
  { id: 'early_bird',      condition: 'early_study',       threshold: 1 },
  { id: 'daily_champ',     condition: 'daily_challenges',  threshold: 7 },
  { id: 'course_complete', condition: 'courses_completed', threshold: 1 },
];

/**
 * The numeric level used for badge thresholds and progression.
 * Matches the frontend formula (floor(xp / 100) + 1).
 */
export const levelFromXp = (xp = 0) => Math.floor(xp / 100) + 1;

export default BADGES;
