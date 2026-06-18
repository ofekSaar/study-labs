import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ['google', 'github', 'facebook', 'local'],
    },
    providerId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    roles: {
      type: [String],
      enum: ['student', 'instructor', 'admin'],
      default: [],
    },
    // Keep for backward compatibility, maps to primary role
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin', null],
      default: null,
    },
    // Gamification state persistence
    coins: {
      type: Number,
      default: 100,
    },
    streakShields: {
      type: Number,
      default: 0,
    },
    xpBoosts: {
      type: Number,
      default: 0,
    },
    weekendFreezes: {
      type: Number,
      default: 0,
    },
    activeAvatar: {
      type: String,
      default: 'default',
    },
    activeTitle: {
      type: String,
      default: 'beginner',
    },
    unlockedAvatars: {
      type: [String],
      default: ['default'],
    },
    unlockedTitles: {
      type: [String],
      default: ['beginner'],
    },
    activeTheme: {
      type: String,
      default: 'default',
    },
    unlockedThemes: {
      type: [String],
      default: ['default'],
    },
    activeFrame: {
      type: String,
      default: 'default',
    },
    unlockedFrames: {
      type: [String],
      default: ['default'],
    },
    unlockedBadges: {
      type: [String],
      default: [],
    },
    stats: {
      lessons_completed: { type: Number, default: 0 },
      perfect_quizzes: { type: Number, default: 0 },
      streak: { type: Number, default: 0 },
      fast_answers: { type: Number, default: 0 },
      no_mistake_streak: { type: Number, default: 0 },
      level: { type: Number, default: 1 },
      total_xp: { type: Number, default: 0 },
      night_study: { type: Number, default: 0 },
      early_study: { type: Number, default: 0 },
      daily_challenges: { type: Number, default: 0 },
      courses_completed: { type: Number, default: 0 },
    },
    questsProgress: {
      type: Map,
      of: Number,
      default: {},
    },
    questsClaimed: {
      type: [String],
      default: [],
    },
    dailyChallengeCompleted: {
      type: Boolean,
      default: false,
    },
    lastChallengeDate: {
      type: String,
      default: null,
    },
    activityLog: {
      type: [String],
      default: [],
    },
    purchaseHistory: {
      type: [
        {
          category: String,
          itemId: String,
          cost: Number,
          purchasedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for provider lookups
userSchema.index({ provider: 1, providerId: 1 }, { unique: true });

// Don't return sensitive fields in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
