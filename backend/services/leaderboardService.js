import mongoose from 'mongoose';
import Progress from '../models/Progress.js';
import XpEvent from '../models/XpEvent.js';
import { TOP_LEADERBOARD_N } from '../constants/config.js';

/**
 * Build leaderboard rows from either XpEvents (windowed) or Progress (all-time).
 *
 * @param {object}   options
 * @param {Date|null} options.since          - Start date for windowed ranking; null = all-time
 * @param {mongoose.Types.ObjectId|null} options.courseFilter  - Restrict to a single course
 * @param {mongoose.Types.ObjectId[]|null} options.studentFilter - Restrict to specific students
 * @param {number}   [options.topN]          - Max entries to return (defaults to TOP_LEADERBOARD_N)
 * @returns {Promise<object[]>} Raw aggregation rows with _id, totalXP, name, avatar
 */
export const buildLeaderboardRows = async ({
  since,
  courseFilter = null,
  studentFilter = null,
  topN = TOP_LEADERBOARD_N,
}) => {
  if (since) {
    const match = { createdAt: { $gte: since } };
    if (courseFilter) match.course = courseFilter;
    if (studentFilter) match.student = { $in: studentFilter };

    return XpEvent.aggregate([
      { $match: match },
      { $group: { _id: '$student', totalXP: { $sum: '$xpAwarded' } } },
      { $sort: { totalXP: -1 } },
      { $limit: topN },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userDoc' } },
      { $unwind: '$userDoc' },
      { $project: { _id: 1, totalXP: 1, name: '$userDoc.name', avatar: '$userDoc.avatar', photoUrl: '$userDoc.photoUrl' } },
    ]);
  }

  // All-time: use denormalized Progress totals
  const match = {};
  if (courseFilter) match.course = { $eq: courseFilter };
  if (studentFilter) match.student = { $in: studentFilter };

  const pipeline = [
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    ...(courseFilter
      ? []
      : [{ $group: { _id: '$student', totalXP: { $sum: '$totalXP' } } }]),
    { $sort: { totalXP: -1 } },
    { $limit: topN },
    {
      $lookup: {
        from: 'users',
        localField: courseFilter ? 'student' : '_id',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: '$userDoc' },
    {
      $project: {
        _id: courseFilter ? '$student' : 1,
        totalXP: 1,
        name: '$userDoc.name',
        avatar: '$userDoc.avatar', photoUrl: '$userDoc.photoUrl',
      },
    },
  ];

  return Progress.aggregate(pipeline);
};
