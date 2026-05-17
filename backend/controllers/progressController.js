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
