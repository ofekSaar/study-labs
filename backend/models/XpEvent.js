import mongoose from 'mongoose';

/**
 * XpEvent — an immutable audit record of a single XP grant.
 *
 * The platform previously stored only cumulative XP on the Progress document,
 * which made it impossible to answer "how much XP this week?" or to rank a
 * weekly/monthly leaderboard. Recording one row per grant unlocks
 * time-windowed leaderboards, leagues, weekly insights, and an audit trail
 * that proves the economy is real (and server-authoritative).
 */
const xpEventSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    node: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseNode',
      default: null,
    },
    source: {
      type: String,
      enum: ['lesson', 'quiz', 'quest', 'daily_challenge', 'streak_bonus', 'combo'],
      required: true,
    },
    // XP before any multiplier (e.g. node.xpReward or a quest reward)
    baseXp: {
      type: Number,
      required: true,
    },
    // Effective multiplier applied (1.0 when none)
    multiplier: {
      type: Number,
      default: 1,
    },
    // Final XP credited to the student: round(baseXp * multiplier) + bonuses
    xpAwarded: {
      type: Number,
      required: true,
    },
    // Human-readable reasons the multiplier applied (for UI / debugging)
    multiplierReasons: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Primary access pattern: a student's events within a time window.
xpEventSchema.index({ student: 1, createdAt: -1 });
// Course-scoped windowed leaderboards.
xpEventSchema.index({ course: 1, createdAt: -1 });
// Global windowed leaderboards.
xpEventSchema.index({ createdAt: -1 });

const XpEvent = mongoose.model('XpEvent', xpEventSchema);

export default XpEvent;
