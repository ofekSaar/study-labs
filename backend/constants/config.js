// ── Course Generation ─────────────────────────────────────────────────────────
export const STUCK_GENERATION_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes
export const MAX_GENERATION_ATTEMPTS = 2; // 1 initial + 1 retry

// ── Leaderboard ───────────────────────────────────────────────────────────────
export const TOP_LEADERBOARD_N = 50;

// ── Analytics: At-Risk Detection ─────────────────────────────────────────────
export const AT_RISK_COMPLETION_PCT = 25;  // below this % completion → at-risk
export const AT_RISK_INACTIVITY_DAYS = 5;  // inactive for this many days → at-risk

// ── Analytics: Concept Mastery Thresholds ────────────────────────────────────
export const MASTERY_EXCELLENT = 85;
export const MASTERY_MODERATE = 72;

// ── XP Multiplier Tiers ───────────────────────────────────────────────────────
export const STREAK_HIGH_THRESHOLD = 5;
export const STREAK_HIGH_MULTIPLIER = 1.5;
export const STREAK_MID_THRESHOLD = 3;
export const STREAK_MID_MULTIPLIER = 1.2;

export const NIGHT_OWL_HOUR_START = 0;
export const NIGHT_OWL_HOUR_END = 4;
export const NIGHT_OWL_MULTIPLIER = 1.5;

export const EARLY_BIRD_HOUR_START = 5;
export const EARLY_BIRD_HOUR_END = 7;
export const EARLY_BIRD_MULTIPLIER = 1.3;

export const XP_BOOST_MULTIPLIER = 2.0;

// ── Quiz XP Awards (per question type) ────────────────────────────────────────
export const XP_PER_MCQ = 100;
export const XP_PER_OPEN = 150;
export const XP_BY_QUESTION_TYPE = {
  mcq: XP_PER_MCQ,
  open: XP_PER_OPEN,
};

// ── Generation Status Enum ─────────────────────────────────────────────────────
export const GENERATION_STATUS = Object.freeze({
  GENERATING: 'generating',
  READY: 'ready',
  FAILED: 'failed',
});

// ── Demo Courses ───────────────────────────────────────────────────────────────
export const DEMO_COURSE_TITLES = [
  'מבוא למדעי המחשב - פייתון',
  'מבוא לחדו״א - חשבון אינפיניטסימלי',
];
