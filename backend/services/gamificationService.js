import createError from 'http-errors';
import Progress from '../models/Progress.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';

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

    // Atomically complete the node and award XP to avoid double payouts
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

    // Find the next node in sequential order
    const nextNode = await CourseNode.findOne({
        course: courseId,
        order: { $gt: node.order },
    }).sort({ order: 1 });

    updatedProgress.currentNode = nextNode?._id || null;
    await updatedProgress.save();

    progress = updatedProgress;
    const totalNodes = await CourseNode.countDocuments({ course: courseId });

    return {
        isInstructor: false,
        xpEarned: node.xpReward,
        totalXP: progress.totalXP,
        streak: progress.streak,
        completedCount: progress.completedNodes.length,
        totalNodes,
        percentComplete: Math.round((progress.completedNodes.length / totalNodes) * 100),
        nextNode: nextNode
            ? { _id: nextNode._id, title: nextNode.title, type: nextNode.type }
            : null,
    };
};
