import createError from 'http-errors';
import mongoose from 'mongoose';
import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
import * as gamificationService from '../services/gamificationService.js';

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
  } catch (error) {
    next(error);
  }
};

/**
 * Shape a raw aggregation result into the leaderboard entry the frontend expects.
 * NOTE: The Progress schema stores only cumulative totalXP with no per-event
 * timestamps, so period-based filtering (weekly/monthly) is not possible.
 * All period values return the all-time ranking. A future migration that
 * introduces an XpEvent collection with timestamps would unlock real windowing.
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
    // period param is accepted but has no effect — see comment on shapeLeaderboardEntries
    const TOP_N = 50;

    const rows = await Progress.aggregate([
      {
        $group: {
          _id: '$student',
          totalXP: { $sum: '$totalXP' },
        },
      },
      { $sort: { totalXP: -1 } },
      { $limit: TOP_N },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
      { $unwind: '$userDoc' },
      {
        $project: {
          _id: 1,
          totalXP: 1,
          name: '$userDoc.name',
          avatar: '$userDoc.avatar',
        },
      },
    ]);

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

    const rows = await Progress.aggregate([
      {
        $match: {
          course: { $eq: new mongoose.Types.ObjectId(courseId) },
          student: { $in: enrolledStudentIds },
        },
      },
      { $sort: { totalXP: -1 } },
      { $limit: TOP_N },
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
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

    const leaderboard = shapeLeaderboardEntries(rows, req.user._id);

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
};
