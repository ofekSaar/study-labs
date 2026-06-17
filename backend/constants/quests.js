/**
 * QUEST DEFINITIONS (server copy)
 *
 * Mirrors QUEST_DEFINITIONS in frontend/src/constants/gamification.js. The
 * server needs the canonical `target` and `xp` so it can validate a claim —
 * the client cannot be trusted to report that a quest was completed or how much
 * XP it pays. Keep ids/targets/xp in sync with the frontend table.
 */
export const QUEST_DEFINITIONS = {
  daily: [
    { id: 'daily_complete_lesson', action: 'complete_lesson', target: 1, xp: 120 },
    { id: 'daily_perfect_quiz',    action: 'perfect_quiz',    target: 1, xp: 200 },
    { id: 'daily_speed_demon',     action: 'speed_bonus',     target: 1, xp: 150 },
  ],
  weekly: [
    { id: 'weekly_lessons',          action: 'complete_lesson', target: 5, xp: 500 },
    { id: 'weekly_perfect_quizzes',  action: 'perfect_quiz',    target: 3, xp: 600 },
    { id: 'weekly_speed_demon',      action: 'speed_bonus',     target: 3, xp: 450 },
  ],
  milestone: [
    { id: 'milestone_level_10',            action: 'level',           target: 10, xp: 1000 },
    { id: 'milestone_lessons_25',          action: 'complete_lesson', target: 25, xp: 800 },
    { id: 'milestone_perfect_quizzes_10',  action: 'perfect_quiz',    target: 10, xp: 1200 },
  ],
};

/** Flat lookup of questId -> definition across all tiers. */
export const QUEST_BY_ID = Object.values(QUEST_DEFINITIONS)
  .flat()
  .reduce((acc, q) => {
    acc[q.id] = q;
    return acc;
  }, {});

export default QUEST_DEFINITIONS;
