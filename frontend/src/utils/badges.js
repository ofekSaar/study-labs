/**
 * BADGE DEFINITIONS
 * Each badge has: id, name, description, icon (emoji), rarity, and an unlock condition key.
 */

export const BADGES = [
    // ── First actions ────────────────────────────────────────────────
    { id: 'first_lesson',   name: 'First Steps',     description: 'Complete your first lesson',        icon: '🎓', rarity: 'common',    condition: 'lessons_completed', threshold: 1   },
    { id: 'first_perfect',  name: 'Sharpshooter',    description: 'Score 100% on a quiz',              icon: '🎯', rarity: 'uncommon',  condition: 'perfect_quizzes',   threshold: 1   },
    { id: 'first_streak',   name: 'Consistent',      description: 'Log in 3 days in a row',            icon: '📅', rarity: 'common',    condition: 'streak',            threshold: 3   },

    // ── Speed & skill ─────────────────────────────────────────────────
    { id: 'speed_demon',    name: 'Speed Demon',     description: 'Answer a question in under 5s',     icon: '⚡', rarity: 'uncommon',  condition: 'fast_answers',      threshold: 1   },
    { id: 'no_mistakes_5',  name: 'Flawless',        description: 'Answer 5 questions without error',  icon: '🛡️', rarity: 'uncommon',  condition: 'no_mistake_streak', threshold: 5   },
    { id: 'triple_perfect', name: 'Perfectionist',   description: 'Score 100% on 3 quizzes',           icon: '💎', rarity: 'rare',      condition: 'perfect_quizzes',   threshold: 3   },

    // ── Streaks ───────────────────────────────────────────────────────
    { id: 'streak_7',       name: 'On Fire',         description: '7-day learning streak',             icon: '🔥', rarity: 'uncommon',  condition: 'streak',            threshold: 7   },
    { id: 'streak_30',      name: 'Unstoppable',     description: '30-day learning streak',            icon: '🌋', rarity: 'legendary', condition: 'streak',            threshold: 30  },
    { id: 'streak_100',     name: 'Century Club',    description: '100-day learning streak',           icon: '💯', rarity: 'legendary', condition: 'streak',            threshold: 100 },

    // ── XP & Levels ───────────────────────────────────────────────────
    { id: 'level_5',        name: 'Rising Star',     description: 'Reach Level 5',                     icon: '⭐', rarity: 'uncommon',  condition: 'level',             threshold: 5   },
    { id: 'level_10',       name: 'Scholar',         description: 'Reach Level 10',                    icon: '📚', rarity: 'rare',      condition: 'level',             threshold: 10  },
    { id: 'level_25',       name: 'Grandmaster',     description: 'Reach Level 25',                    icon: '👑', rarity: 'legendary', condition: 'level',             threshold: 25  },
    { id: 'xp_1000',        name: 'Knowledge Seeker',description: 'Earn 1,000 total XP',               icon: '🧠', rarity: 'uncommon',  condition: 'total_xp',          threshold: 1000},
    { id: 'xp_5000',        name: 'XP Legend',       description: 'Earn 5,000 total XP',               icon: '🏆', rarity: 'legendary', condition: 'total_xp',          threshold: 5000},

    // ── Volume ────────────────────────────────────────────────────────
    { id: 'lessons_10',     name: 'Dedicated',       description: 'Complete 10 lessons',               icon: '📖', rarity: 'uncommon',  condition: 'lessons_completed', threshold: 10  },
    { id: 'lessons_50',     name: 'Marathon Runner', description: 'Complete 50 lessons',               icon: '🏃', rarity: 'rare',      condition: 'lessons_completed', threshold: 50  },

    // ── Special ───────────────────────────────────────────────────────
    { id: 'night_owl',      name: 'Night Owl',       description: 'Study after midnight',              icon: '🦉', rarity: 'uncommon',  condition: 'night_study',       threshold: 1   },
    { id: 'early_bird',     name: 'Early Bird',      description: 'Study before 7am',                  icon: '🌅', rarity: 'uncommon',  condition: 'early_study',       threshold: 1   },
    { id: 'daily_champ',    name: 'Daily Champion',  description: 'Complete 7 daily challenges',       icon: '🥇', rarity: 'rare',      condition: 'daily_challenges',  threshold: 7   },
    { id: 'course_complete',name: 'Graduate',        description: 'Complete an entire course',         icon: '🎓', rarity: 'rare',      condition: 'courses_completed', threshold: 1   },
];

export const RARITY_STYLES = {
    common:    { label: 'Common',    bg: 'bg-slate-100 dark:bg-white/10',           border: 'border-slate-300 dark:border-white/20',    text: 'text-slate-500 dark:text-white/50',  glow: '' },
    uncommon:  { label: 'Uncommon',  bg: 'bg-emerald-500/10',                        border: 'border-emerald-500/30',                    text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
    rare:      { label: 'Rare',      bg: 'bg-indigo-500/10',                         border: 'border-indigo-500/30',                     text: 'text-indigo-600 dark:text-indigo-300', glow: 'shadow-[0_0_10px_rgba(99,102,241,0.25)]' },
    legendary: { label: 'Legendary', bg: 'bg-gradient-to-br from-amber-500/15 to-orange-500/10', border: 'border-amber-500/40', text: 'text-amber-600 dark:text-amber-400', glow: 'shadow-[0_0_14px_rgba(245,158,11,0.3)]' },
};

/**
 * Check which badges should be unlocked given a stats snapshot.
 * Returns array of badge IDs that are newly earned.
 */
export const checkBadges = (stats = {}, alreadyUnlocked = []) => {
    const newlyEarned = [];
    for (const badge of BADGES) {
        if (alreadyUnlocked.includes(badge.id)) continue;
        const value = stats[badge.condition] ?? 0;
        if (value >= badge.threshold) {
            newlyEarned.push(badge.id);
        }
    }
    return newlyEarned;
};

export default BADGES;
