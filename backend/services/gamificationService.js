import createError from 'http-errors';
import Progress from '../models/Progress.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import XpEvent from '../models/XpEvent.js';
import User from '../models/User.js';
import { evaluateNewBadges } from './badgeService.js';
import { levelFromXp } from '../constants/badges.js';

// Coins minted per XP awarded. Coins are the soft currency spent in the shop.
export const COIN_RATE = 0.1;

/**
 * Compute the XP multiplier server-side. This is the single source of truth —
 * the frontend's getXPMultiplier() is now display-only and must mirror these
 * tiers. All inputs are known to the server (streak from Progress, boost token
 * from User, hour from the server clock) so no trusted client input is needed.
 *
 * @param {object} opts
 * @param {number} opts.streak   - current streak (days)
 * @param {number} [opts.hour]   - hour of day 0-23 (defaults to server now)
 * @param {boolean} opts.hasBoost - whether an XP boost token is being consumed
 * @returns {{ multiplier: number, reasons: string[] }}
 */
export const computeMultiplier = ({ streak = 0, hour, hasBoost = false }) => {
    const h = hour ?? new Date().getHours();
    let multiplier = 1.0;
    const reasons = [];

    // 1. Streak multiplier
    if (streak >= 5) {
        multiplier = 1.5;
        reasons.push('5+ Day Streak (1.5x)');
    } else if (streak >= 3) {
        multiplier = 1.2;
        reasons.push('3+ Day Streak (1.2x)');
    }

    // 2. Hour multiplier (Night Owl / Early Bird) — never lowers the streak bonus
    if (h >= 0 && h < 4) {
        if (multiplier < 1.5) {
            multiplier = 1.5;
            reasons.push('Night Owl Hour (1.5x)');
        }
    } else if (h >= 5 && h < 7) {
        if (multiplier < 1.3) {
            multiplier = 1.3;
            reasons.push('Early Bird Hour (1.3x)');
        }
    }

    // 3. XP boost powerup token (stacks multiplicatively)
    if (hasBoost) {
        multiplier *= 2.0;
        reasons.push('XP Boost Token Active (2.0x)');
    }

    return { multiplier, reasons };
};

/**
 * Get name of Level based on cumulative XP.
 * @param {number} xp 
 * @returns {string} Level name
 */
export const getLevelName = (xp) => {
    if (xp >= 10000) return 'Grand Master';
    if (xp >= 5000) return 'Master';
    if (xp >= 2500) return 'Code Wizard';
    if (xp >= 1000) return 'Expert';
    if (xp >= 500) return 'Intermediate';
    if (xp >= 100) return 'Apprentice';
    return 'Beginner';
};

/**
 * Aggregates student stats.
 * @param {string} studentId 
 * @returns {Promise<object>} Stats
 */
export const getUserStats = async (studentId) => {
    const progressRecords = await Progress.find({ student: studentId });

    const totalXP = progressRecords.reduce((sum, p) => sum + p.totalXP, 0);
    const maxStreak = progressRecords.reduce((max, p) => Math.max(max, p.streak), 0);
    const levelName = getLevelName(totalXP);

    return {
        totalXP,
        streak: maxStreak,
        levelName,
        coursesInProgress: progressRecords.length,
    };
};

/**
 * Gets progress details for a single course.
 * @param {string} studentId 
 * @param {string} courseId 
 * @returns {Promise<object>} Course progress payload
 */
export const getCourseProgress = async (studentId, courseId) => {
    const progress = await Progress.findOne({
        student: studentId,
        course: courseId,
    }).populate('completedNodes', 'title type order')
      .populate('currentNode', 'title type order');

    if (!progress) {
        // Verify enrollment status
        const enrollment = await Enrollment.findOne({
            student: studentId,
            course: courseId,
            status: 'approved',
        });

        if (!enrollment) {
            throw createError(403, 'You are not enrolled in this course');
        }

        return {
            completedNodes: [],
            currentNode: null,
            totalXP: 0,
            streak: 0,
            percentComplete: 0,
        };
    }

    const totalNodes = await CourseNode.countDocuments({ course: courseId });

    return {
        ...progress.toObject(),
        percentComplete: totalNodes > 0
            ? Math.round((progress.completedNodes.length / totalNodes) * 100)
            : 0,
    };
};

/**
 * Handles completing a node in a course.
 * @param {object} user User object
 * @param {string} courseId Course ID
 * @param {string} nodeId Node ID
 * @returns {Promise<object>} Completion details
 */
export const completeCourseNode = async (user, courseId, nodeId) => {
    // Instructors don't track progress
    if (user.role === 'instructor') {
        return {
            isInstructor: true,
            message: 'Progress tracking is disabled for instructors'
        };
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
        student: user._id,
        course: courseId,
        status: 'approved',
    });
    if (!enrollment) {
        throw createError(403, 'You are not enrolled in this course');
    }

    // Find the node
    const node = await CourseNode.findOne({ _id: nodeId, course: courseId });
    if (!node) {
        throw createError(404, 'Node not found');
    }

    // Find or create progress
    let progress = await Progress.findOne({
        student: user._id,
        course: courseId,
    });

    if (!progress) {
        progress = new Progress({
            student: user._id,
            course: courseId,
            completedNodes: [],
            totalXP: 0,
            streak: 0,
        });
        await progress.save();
    }

    // Guard against double-payouts: if already completed, bail before any grant.
    if (progress.completedNodes.some((n) => n.toString() === nodeId.toString())) {
        throw createError(400, 'Node already completed');
    }

    // ── Determine base XP from an authoritative source ──────────────────────
    // For quiz nodes, base XP is the server-graded score of the latest attempt
    // (performance-based, "earned"). For non-quiz nodes, the node's flat reward.
    let baseXp = node.xpReward;
    if (node.quizData && node.quizData.length > 0) {
        const attempt = await QuizAttempt.findOne({
            student: user._id,
            courseNode: nodeId,
        }).sort({ createdAt: -1 });
        if (attempt) baseXp = attempt.score;
    }

    // ── Compute the streak, then the multiplier (server-authoritative) ──────
    progress.updateStreak(); // mutates progress.streak + lastActivityDate

    // Re-fetch the user as a mutable document (req.user may be a lean copy).
    const userDoc = await User.findById(user._id);
    if (!userDoc) {
        throw createError(404, 'User not found');
    }

    const hasBoost = (userDoc.xpBoosts || 0) > 0;
    const { multiplier, reasons } = computeMultiplier({
        streak: progress.streak,
        hasBoost,
    });
    const xpAwarded = Math.round(baseXp * multiplier);

    // ── Atomically claim the node and credit per-course XP ──────────────────
    const nextNode = await CourseNode.findOne({
        course: courseId,
        order: { $gt: node.order },
    }).sort({ order: 1 });

    const updatedProgress = await Progress.findOneAndUpdate(
        { _id: progress._id, completedNodes: { $ne: nodeId } },
        {
            $addToSet: { completedNodes: nodeId },
            $inc: { totalXP: xpAwarded },
            $set: {
                streak: progress.streak,
                lastActivityDate: progress.lastActivityDate,
                currentNode: nextNode?._id || null,
            },
        },
        { new: true }
    );

    if (!updatedProgress) {
        // Lost a race — another request completed it first. No double grant.
        throw createError(400, 'Node already completed');
    }
    progress = updatedProgress;

    const totalNodes = await CourseNode.countDocuments({ course: courseId });
    const completedCount = progress.completedNodes.length;
    const justCompletedCourse = totalNodes > 0 && completedCount === totalNodes;

    // ── Update the user-level economy (XP, level, coins, badges) ────────────
    if (hasBoost) userDoc.xpBoosts = Math.max(0, (userDoc.xpBoosts || 0) - 1);

    const prevTotalXp = userDoc.stats.total_xp || 0;
    const prevLevel = userDoc.stats.level || 1;
    const newTotalXp = prevTotalXp + xpAwarded;
    const newLevel = levelFromXp(newTotalXp);
    const coinsMinted = Math.round(xpAwarded * COIN_RATE);

    userDoc.stats.total_xp = newTotalXp;
    userDoc.stats.level = newLevel;
    userDoc.stats.streak = Math.max(userDoc.stats.streak || 0, progress.streak);
    if (justCompletedCourse) {
        userDoc.stats.courses_completed = (userDoc.stats.courses_completed || 0) + 1;
    }
    userDoc.coins = (userDoc.coins || 0) + coinsMinted;

    // Server-side badge evaluation against the authoritative stats snapshot.
    const newBadges = evaluateNewBadges(
        userDoc.stats.toObject ? userDoc.stats.toObject() : userDoc.stats,
        userDoc.unlockedBadges
    );
    if (newBadges.length > 0) {
        userDoc.unlockedBadges = [...userDoc.unlockedBadges, ...newBadges];
    }

    await userDoc.save();

    // ── Persist the immutable audit record ──────────────────────────────────
    await XpEvent.create({
        student: user._id,
        course: courseId,
        node: nodeId,
        source: node.quizData && node.quizData.length > 0 ? 'quiz' : 'lesson',
        baseXp,
        multiplier,
        xpAwarded,
        multiplierReasons: reasons,
    });

    return {
        isInstructor: false,
        xpEarned: xpAwarded, // legacy alias kept for the existing client contract
        xpAwarded,
        baseXp,
        multiplier,
        multiplierReasons: reasons,
        boostConsumed: hasBoost,
        coinsMinted,
        newCoins: userDoc.coins,
        totalXP: progress.totalXP,
        streak: progress.streak,
        userTotalXp: newTotalXp,
        newLevel,
        leveledUp: newLevel > prevLevel,
        newBadges,
        courseCompleted: justCompletedCourse,
        completedCount,
        totalNodes,
        percentComplete: Math.round((completedCount / totalNodes) * 100),
        nextNode: nextNode
            ? { _id: nextNode._id, title: nextNode.title, type: nextNode.type }
            : null,
    };
};

/**
 * Apply a flat XP grant to a user's economy (XP, level, coins, badges) and
 * write the audit event. Used for grants that are NOT tied to node completion,
 * e.g. claiming a quest reward or completing the daily challenge.
 *
 * @param {object} userDoc - a mutable Mongoose User document (will be saved)
 * @param {object} opts
 * @param {number} opts.baseXp
 * @param {number} [opts.multiplier=1]
 * @param {string} opts.source - XpEvent source enum
 * @param {string|null} [opts.course]
 * @param {string|null} [opts.node]
 * @param {string[]} [opts.reasons]
 * @returns {Promise<object>} grant result
 */
export const grantXp = async (
    userDoc,
    { baseXp, multiplier = 1, source, course = null, node = null, reasons = [] }
) => {
    const xpAwarded = Math.round(baseXp * multiplier);
    const prevLevel = userDoc.stats.level || 1;
    const newTotalXp = (userDoc.stats.total_xp || 0) + xpAwarded;
    const newLevel = levelFromXp(newTotalXp);
    const coinsMinted = Math.round(xpAwarded * COIN_RATE);

    userDoc.stats.total_xp = newTotalXp;
    userDoc.stats.level = newLevel;
    userDoc.coins = (userDoc.coins || 0) + coinsMinted;

    const newBadges = evaluateNewBadges(
        userDoc.stats.toObject ? userDoc.stats.toObject() : userDoc.stats,
        userDoc.unlockedBadges
    );
    if (newBadges.length > 0) {
        userDoc.unlockedBadges = [...userDoc.unlockedBadges, ...newBadges];
    }

    await userDoc.save();

    await XpEvent.create({
        student: userDoc._id,
        course,
        node,
        source,
        baseXp,
        multiplier,
        xpAwarded,
        multiplierReasons: reasons,
    });

    return {
        xpAwarded,
        coinsMinted,
        newCoins: userDoc.coins,
        userTotalXp: newTotalXp,
        newLevel,
        leveledUp: newLevel > prevLevel,
        newBadges,
    };
};
