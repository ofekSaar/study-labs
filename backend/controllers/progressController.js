import createError from 'http-errors';
import Progress from '../models/Progress.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';

/**
 * Get aggregate student stats (totalXP, streak, level).
 */
export const getStats = async (req, res, next) => {
  try {
    const progressRecords = await Progress.find({ student: req.user._id });

    const totalXP = progressRecords.reduce((sum, p) => sum + p.totalXP, 0);
    const maxStreak = progressRecords.reduce((max, p) => Math.max(max, p.streak), 0);

    // Calculate level based on XP thresholds
    const levelName = getLevelName(totalXP);

    res.json({
      status: 'success',
      data: {
        totalXP,
        streak: maxStreak,
        levelName,
        coursesInProgress: progressRecords.length,
      },
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
    const progress = await Progress.findOne({
      student: req.user._id,
      course: req.params.courseId,
    }).populate('completedNodes', 'title type order')
      .populate('currentNode', 'title type order');

    if (!progress) {
      // Check if student is enrolled
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: req.params.courseId,
        status: 'approved',
      });

      if (!enrollment) {
        throw createError(403, 'You are not enrolled in this course');
      }

      // Return empty progress
      return res.json({
        status: 'success',
        data: {
          progress: {
            completedNodes: [],
            currentNode: null,
            totalXP: 0,
            streak: 0,
            percentComplete: 0,
          },
        },
      });
    }

    const totalNodes = await CourseNode.countDocuments({
      course: req.params.courseId,
    });

    res.json({
      status: 'success',
      data: {
        progress: {
          ...progress.toObject(),
          percentComplete: totalNodes > 0
            ? Math.round((progress.completedNodes.length / totalNodes) * 100)
            : 0,
        },
      },
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

    // Instructors don't track progress
    if (req.user.role === 'instructor') {
      return res.json({
        status: 'success',
        data: { message: 'Progress tracking is disabled for instructors' }
      });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
      status: 'approved',
    });
    if (!enrollment) throw createError(403, 'You are not enrolled in this course');

    // Find the node
    const node = await CourseNode.findOne({ _id: nodeId, course: courseId });
    if (!node) throw createError(404, 'Node not found');

    // Find or create progress
    let progress = await Progress.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (!progress) {
      progress = new Progress({
        student: req.user._id,
        course: courseId,
        completedNodes: [],
        totalXP: 0,
        streak: 0,
      });
      await progress.save();
    }

    // Atomically complete the node and add XP to avoid race conditions
    const updatedProgress = await Progress.findOneAndUpdate(
      { _id: progress._id, completedNodes: { $ne: nodeId } },
      {
        $addToSet: { completedNodes: nodeId },
        $inc: { totalXP: node.xpReward }
      },
      { new: true }
    );

    if (!updatedProgress) {
      throw createError(400, 'Node already completed');
    }

    updatedProgress.updateStreak();

    // Find the next node in order
    const nextNode = await CourseNode.findOne({
      course: courseId,
      order: { $gt: node.order },
    }).sort({ order: 1 });

    updatedProgress.currentNode = nextNode?._id || null;
    await updatedProgress.save();

    progress = updatedProgress;

    const totalNodes = await CourseNode.countDocuments({ course: courseId });

    res.json({
      status: 'success',
      data: {
        xpEarned: node.xpReward,
        totalXP: progress.totalXP,
        streak: progress.streak,
        completedCount: progress.completedNodes.length,
        totalNodes,
        percentComplete: Math.round((progress.completedNodes.length / totalNodes) * 100),
        nextNode: nextNode
          ? { _id: nextNode._id, title: nextNode.title, type: nextNode.type }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * XP-based level names.
 */
function getLevelName(xp) {
  if (xp >= 10000) return 'Grand Master';
  if (xp >= 5000) return 'Master';
  if (xp >= 2500) return 'Code Wizard';
  if (xp >= 1000) return 'Expert';
  if (xp >= 500) return 'Intermediate';
  if (xp >= 100) return 'Apprentice';
  return 'Beginner';
}
