import createError from 'http-errors';
import mongoose from 'mongoose';
import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import * as gamificationService from '../services/gamificationService.js';
import { getIO } from '../config/socket.js';
import XpEvent from '../models/XpEvent.js';
import { QUEST_BY_ID } from '../constants/quests.js';

/**
 * Map a leaderboard period to a {createdAt: {$gte}} match, or null for all-time.
 */
const periodToSince = (period) => {
  const now = Date.now();
  if (period === 'weekly') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (period === 'monthly') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return null; // allTime
};

/**
 * Get aggregate student stats (totalXP, streak, level).
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await gamificationService.getUserStats(req.user._id);
    res.json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get progress for a specific course.
 */
export const getCourseProgress = async (req, res, next) => {
  try {
    const progress = await gamificationService.getCourseProgress(
      req.user._id,
      req.params.courseId
    );
    res.json({
      status: 'success',
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a node as completed, award XP.
 */
export const completeNode = async (req, res, next) => {
  try {
    const { courseId, nodeId } = req.body;
    const result = await gamificationService.completeCourseNode(
      req.user,
      courseId,
      nodeId
    );

    res.json({
      status: 'success',
      data: result,
    });

    // Broadcast leaderboard update event to all sockets
    try {
      const io = getIO();
      if (io) {
        io.emit('leaderboard_update', {
          userId: req.user._id.toString(),
          courseId
        });
      }
    } catch (err) {
      console.error('[Socket] Failed to broadcast leaderboard update:', err.message);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Shape a raw aggregation result into the leaderboard entry the frontend expects.
 * Rows must expose `_id` (student), `totalXP`, `name`, and `avatar`.
 *
 * @param {object[]} rows   - Aggregation pipeline results
 * @param {string}   userId - Current user's _id string for isYou flagging
 * @returns {object[]} Ranked leaderboard entries
 */
const shapeLeaderboardEntries = (rows, userId) =>
  rows.map((row, index) => ({
    rank: index + 1,
    userId: row._id,
    name: row.name,
    avatar: row.avatar || null,
    xp: row.totalXP,
    level: gamificationService.getLevelName(row.totalXP),
    isYou: row._id.toString() === userId.toString(),
  }));

/**
 * GET /api/progress/leaderboard?period=weekly|monthly|allTime
 * Returns the global leaderboard ranked by cumulative XP across all courses.
 * Any authenticated user (student or instructor) may view this.
 */
export const getGlobalLeaderboard = async (req, res, next) => {
  try {
    const TOP_N = 50;
    const since = periodToSince(req.query.period);

    let rows;
    if (since) {
      // Windowed ranking: sum XpEvents within the period.
      rows = await XpEvent.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$student', totalXP: { $sum: '$xpAwarded' } } },
        { $sort: { totalXP: -1 } },
        { $limit: TOP_N },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc' } },
        { $unwind: '$userDoc' },
        { $project: { _id: 1, totalXP: 1, name: '$userDoc.name', avatar: '$userDoc.avatar' } },
      ]);
    } else {
      // All-time: cumulative Progress totals (fast, denormalized).
      rows = await Progress.aggregate([
        { $group: { _id: '$student', totalXP: { $sum: '$totalXP' } } },
        { $sort: { totalXP: -1 } },
        { $limit: TOP_N },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc' } },
        { $unwind: '$userDoc' },
        { $project: { _id: 1, totalXP: 1, name: '$userDoc.name', avatar: '$userDoc.avatar' } },
      ]);
    }

    const leaderboard = shapeLeaderboardEntries(rows, req.user._id);

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/progress/course/:courseId/leaderboard?period=weekly|monthly|allTime
 * Returns the leaderboard for a single course, ranking approved-enrolled students
 * by their per-course XP. Any authenticated user may view the leaderboard for
 * a course they are associated with (enrolled as student or teaching as instructor).
 */
export const getCourseLeaderboard = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const TOP_N = 50;

    // Fetch IDs of all approved enrollments for this course so we only rank
    // students who legitimately belong to it.
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'approved',
    }).select('student');

    if (!enrollments.length) {
      return res.json({ leaderboard: [] });
    }

    const enrolledStudentIds = enrollments.map((e) => e.student);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);
    const since = periodToSince(req.query.period);

    let rows;
    if (since) {
      // Windowed ranking: sum this course's XpEvents within the period.
      rows = await XpEvent.aggregate([
        {
          $match: {
            course: courseObjectId,
            student: { $in: enrolledStudentIds },
            createdAt: { $gte: since },
          },
        },
        { $group: { _id: '$student', totalXP: { $sum: '$xpAwarded' } } },
        { $sort: { totalXP: -1 } },
        { $limit: TOP_N },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc' } },
        { $unwind: '$userDoc' },
        { $project: { _id: 1, totalXP: 1, name: '$userDoc.name', avatar: '$userDoc.avatar' } },
      ]);
    } else {
      rows = await Progress.aggregate([
        {
          $match: {
            course: { $eq: courseObjectId },
            student: { $in: enrolledStudentIds },
          },
        },
        { $sort: { totalXP: -1 } },
        { $limit: TOP_N },
        { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'userDoc' } },
        { $unwind: '$userDoc' },
        {
          $project: {
            _id: '$student',
            totalXP: 1,
            name: '$userDoc.name',
            avatar: '$userDoc.avatar',
          },
        },
      ]);
    }

    const leaderboard = shapeLeaderboardEntries(rows, req.user._id);

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/progress/quests/:questId/claim
 * Claim a completed quest's XP reward. The server validates that the recorded
 * progress meets the quest target and that it has not already been claimed,
 * then grants the canonical reward — the client cannot mint quest XP itself.
 */
export const claimQuest = async (req, res, next) => {
  try {
    const { questId } = req.params;

    const quest = QUEST_BY_ID[questId];
    if (!quest) {
      return next(createError(400, `Unknown quest: ${questId}`));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    if (user.questsClaimed.includes(questId)) {
      return next(createError(400, 'Quest already claimed'));
    }

    const progress = user.questsProgress?.get
      ? user.questsProgress.get(questId) || 0
      : user.questsProgress?.[questId] || 0;
    if (progress < quest.target) {
      return next(createError(400, 'Quest not yet completed'));
    }

    user.questsClaimed = [...user.questsClaimed, questId];
    const grant = await gamificationService.grantXp(user, {
      baseXp: quest.xp,
      source: 'quest',
      reasons: [`Quest Reward: ${questId}`],
    });

    res.json({
      status: 'success',
      data: {
        questId,
        ...grant,
        coins: user.coins,
        stats: user.stats,
        unlockedBadges: user.unlockedBadges,
        questsClaimed: user.questsClaimed,
      },
    });
  } catch (error) {
    next(error);
  }
};

const SHOP_PRICES = {
  avatars: {
    wizard_scholar: 150,
    cyber_learner: 250,
    unicorn_scholar: 400
  },
  titles: {
    knowledge_alchemist: 100,
    ultimate_mind: 200,
    legendary_scholar: 350
  },
  themes: {
    arcade: 200,
    space: 350,
    cyberpunk: 500
  },
  frames: {
    bronze: 100,
    silver: 180,
    gold: 300,
    diamond: 500
  },
  powerups: {
    streak_shield: 75,
    xp_boost: 120,
    weekend_freeze: 150
  }
};

/**
 * GET /api/progress/gamification
 * Get full gamification state for user.
 */
export const getGamificationState = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    res.json({
      status: 'success',
      data: {
        coins: user.coins,
        streakShields: user.streakShields,
        xpBoosts: user.xpBoosts,
        weekendFreezes: user.weekendFreezes,
        activeAvatar: user.activeAvatar,
        activeTitle: user.activeTitle,
        unlockedAvatars: user.unlockedAvatars,
        unlockedTitles: user.unlockedTitles,
        activeTheme: user.activeTheme,
        unlockedThemes: user.unlockedThemes,
        activeFrame: user.activeFrame,
        unlockedFrames: user.unlockedFrames,
        unlockedBadges: user.unlockedBadges,
        stats: user.stats,
        questsProgress: user.questsProgress || {},
        questsClaimed: user.questsClaimed,
        dailyChallengeCompleted: user.dailyChallengeCompleted,
        lastChallengeDate: user.lastChallengeDate,
        activityLog: user.activityLog,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/progress/gamification/sync
 * Sync full gamification state for user.
 */
export const syncGamificationState = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    const {
      streakShields,
      weekendFreezes,
      unlockedBadges,
      stats,
      questsProgress,
      questsClaimed,
      dailyChallengeCompleted,
      lastChallengeDate,
      activityLog,
      activeAvatar,
      activeTitle,
      unlockedAvatars,
      unlockedTitles,
      activeTheme,
      unlockedThemes,
      activeFrame,
      unlockedFrames
    } = req.body;

    // ── Server-owned, NOT accepted from the client (anti-cheat) ─────────────
    // `coins`, `xpBoosts`, and stats.total_xp / stats.level are minted and
    // computed exclusively by the server (see gamificationService). A tampered
    // sync payload can no longer inflate the economy. Activity-flavored stats
    // (lessons_completed, perfect_quizzes, fast_answers, ...) remain
    // client-tracked since they only gate cosmetic badges.
    if (streakShields !== undefined) user.streakShields = streakShields;
    if (weekendFreezes !== undefined) user.weekendFreezes = weekendFreezes;
    // Union badges so neither side clobbers the other's unlocks.
    if (Array.isArray(unlockedBadges)) {
      user.unlockedBadges = [...new Set([...user.unlockedBadges, ...unlockedBadges])];
    }
    if (stats !== undefined) {
      // Strip the server-owned fields before merging.
      const { total_xp, level, ...clientStats } = stats;
      user.stats = { ...user.stats.toObject(), ...clientStats };
    }
    if (questsProgress !== undefined) user.questsProgress = questsProgress;
    if (questsClaimed !== undefined) user.questsClaimed = questsClaimed;
    if (dailyChallengeCompleted !== undefined) user.dailyChallengeCompleted = dailyChallengeCompleted;
    if (lastChallengeDate !== undefined) user.lastChallengeDate = lastChallengeDate;
    if (activityLog !== undefined) user.activityLog = activityLog;

    if (activeAvatar !== undefined) user.activeAvatar = activeAvatar;
    if (activeTitle !== undefined) user.activeTitle = activeTitle;
    if (unlockedAvatars !== undefined) user.unlockedAvatars = unlockedAvatars;
    if (unlockedTitles !== undefined) user.unlockedTitles = unlockedTitles;
    if (activeTheme !== undefined) user.activeTheme = activeTheme;
    if (unlockedThemes !== undefined) user.unlockedThemes = unlockedThemes;
    if (activeFrame !== undefined) user.activeFrame = activeFrame;
    if (unlockedFrames !== undefined) user.unlockedFrames = unlockedFrames;

    await user.save();

    res.json({
      status: 'success',
      data: {
        coins: user.coins,
        streakShields: user.streakShields,
        xpBoosts: user.xpBoosts,
        weekendFreezes: user.weekendFreezes,
        activeAvatar: user.activeAvatar,
        activeTitle: user.activeTitle,
        unlockedAvatars: user.unlockedAvatars,
        unlockedTitles: user.unlockedTitles,
        activeTheme: user.activeTheme,
        unlockedThemes: user.unlockedThemes,
        activeFrame: user.activeFrame,
        unlockedFrames: user.unlockedFrames,
        unlockedBadges: user.unlockedBadges,
        stats: user.stats,
        questsProgress: user.questsProgress || {},
        questsClaimed: user.questsClaimed,
        dailyChallengeCompleted: user.dailyChallengeCompleted,
        lastChallengeDate: user.lastChallengeDate,
        activityLog: user.activityLog,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/progress/gamification/shop/buy
 * Purchase a shop item securely on backend.
 */
export const buyShopItem = async (req, res, next) => {
  try {
    const { category, itemId } = req.body;
    if (!category || !itemId) {
      return next(createError(400, 'Category and Item ID are required'));
    }

    const priceMap = SHOP_PRICES[category];
    if (!priceMap) {
      return next(createError(400, `Invalid category: ${category}`));
    }

    const cost = priceMap[itemId];
    if (cost === undefined) {
      return next(createError(400, `Invalid item: ${itemId} in category ${category}`));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    if (user.coins < cost) {
      return next(createError(400, 'Insufficient coins'));
    }

    // Deduct coins
    user.coins -= cost;

    // Apply the item effects
    if (category === 'powerups') {
      if (itemId === 'streak_shield') {
        user.streakShields = (user.streakShields || 0) + 1;
      } else if (itemId === 'xp_boost') {
        user.xpBoosts = (user.xpBoosts || 0) + 1;
      } else if (itemId === 'weekend_freeze') {
        user.weekendFreezes = (user.weekendFreezes || 0) + 1;
      }
    } else if (category === 'avatars') {
      if (!user.unlockedAvatars.includes(itemId)) {
        user.unlockedAvatars.push(itemId);
      }
    } else if (category === 'titles') {
      if (!user.unlockedTitles.includes(itemId)) {
        user.unlockedTitles.push(itemId);
      }
    } else if (category === 'themes') {
      if (!user.unlockedThemes.includes(itemId)) {
        user.unlockedThemes.push(itemId);
      }
    } else if (category === 'frames') {
      if (!user.unlockedFrames.includes(itemId)) {
        user.unlockedFrames.push(itemId);
      }
    }

    await user.save();

    res.json({
      status: 'success',
      data: {
        coins: user.coins,
        streakShields: user.streakShields,
        xpBoosts: user.xpBoosts,
        weekendFreezes: user.weekendFreezes,
        unlockedAvatars: user.unlockedAvatars,
        unlockedTitles: user.unlockedTitles,
        unlockedThemes: user.unlockedThemes,
        unlockedFrames: user.unlockedFrames
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/progress/gamification/active
 * Update active custom avatar, title, theme or border frame.
 */
export const updateActiveCustomizations = async (req, res, next) => {
  try {
    const { activeAvatar, activeTitle, activeTheme, activeFrame } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(createError(404, 'User not found'));
    }

    if (activeAvatar !== undefined) {
      if (!user.unlockedAvatars.includes(activeAvatar) && activeAvatar !== 'default') {
        return next(createError(400, 'Avatar is locked'));
      }
      user.activeAvatar = activeAvatar;
    }

    if (activeTitle !== undefined) {
      if (!user.unlockedTitles.includes(activeTitle) && activeTitle !== 'beginner') {
        return next(createError(400, 'Title is locked'));
      }
      user.activeTitle = activeTitle;
    }

    if (activeTheme !== undefined) {
      if (!user.unlockedThemes.includes(activeTheme) && activeTheme !== 'default') {
        return next(createError(400, 'Theme is locked'));
      }
      user.activeTheme = activeTheme;
    }

    if (activeFrame !== undefined) {
      if (!user.unlockedFrames.includes(activeFrame) && activeFrame !== 'default') {
        return next(createError(400, 'Frame is locked'));
      }
      user.activeFrame = activeFrame;
    }

    await user.save();

    res.json({
      status: 'success',
      data: {
        activeAvatar: user.activeAvatar,
        activeTitle: user.activeTitle,
        activeTheme: user.activeTheme,
        activeFrame: user.activeFrame
      }
    });
  } catch (error) {
    next(error);
  }
};
