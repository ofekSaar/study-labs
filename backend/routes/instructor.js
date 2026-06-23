import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';

const router = Router();

// All routes require auth + instructor role
router.use(authenticate, authorize('instructor'));

/**
 * GET /api/instructor/stats
 * Aggregated statistics for the authenticated instructor.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId }).lean();
    const courseIds = courses.map(c => c._id);

    // Generation stats
    const totalCourses = courses.length;
    const readyCourses = courses.filter(c => c.generationStatus === 'ready');
    const failedCourses = courses.filter(c => c.generationStatus === 'failed');
    const generatingCourses = courses.filter(c => c.generationStatus === 'generating');
    const pendingCourses = courses.filter(c => c.generationStatus === 'pending');

    const successRate = totalCourses > 0
      ? Math.round((readyCourses.length / totalCourses) * 100)
      : 0;

    const coursesWithTiming = courses.filter(
      c => c.generationStartedAt && c.generationCompletedAt
    );
    const avgGenerationMs = coursesWithTiming.length > 0
      ? Math.round(
          coursesWithTiming.reduce(
            (sum, c) => sum + (c.generationCompletedAt - c.generationStartedAt),
            0
          ) / coursesWithTiming.length
        )
      : null;

    const totalAttempts = courses.reduce((sum, c) => sum + (c.generationAttempts || 0), 0);

    // Enrollment stats
    const [enrollmentStats] = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const enrollmentsByStatus = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const enrMap = Object.fromEntries(enrollmentsByStatus.map(e => [e._id, e.count]));
    const approvedEnrollments = enrMap['approved'] ?? 0;
    const pendingEnrollments = enrMap['pending'] ?? 0;
    const deniedEnrollments = enrMap['denied'] ?? 0;
    const totalEnrollments = approvedEnrollments + pendingEnrollments + deniedEnrollments;
    const approvalRate = (approvedEnrollments + deniedEnrollments) > 0
      ? Math.round((approvedEnrollments / (approvedEnrollments + deniedEnrollments)) * 100)
      : null;

    // Node/content stats
    const nodeStats = await CourseNode.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const nodeMap = Object.fromEntries(nodeStats.map(n => [n._id, n.count]));
    const totalNodes = Object.values(nodeMap).reduce((a, b) => a + b, 0);
    const totalLessons = nodeMap['lesson'] ?? 0;
    const totalQuizzes = nodeMap['quiz'] ?? 0;
    const avgNodesPerCourse = totalCourses > 0 ? Math.round(totalNodes / totalCourses) : 0;

    // Total question edits across all quiz nodes
    const editCountResult = await CourseNode.aggregate([
      { $match: { course: { $in: courseIds }, type: 'quiz' } },
      { $unwind: '$quizData' },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$quizData.editCount', 0] } } } },
    ]);
    const totalQuestionEdits = editCountResult[0]?.total ?? 0;

    // Avg completion across all courses
    let avgCompletionRate = null;
    if (courseIds.length > 0) {
      const progressData = await Progress.aggregate([
        { $match: { course: { $in: courseIds } } },
        {
          $lookup: {
            from: 'coursenodes',
            localField: 'course',
            foreignField: 'course',
            as: 'allNodes',
          },
        },
        {
          $project: {
            completionRate: {
              $cond: [
                { $gt: [{ $size: '$allNodes' }, 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        { $size: '$completedNodes' },
                        { $size: '$allNodes' },
                      ],
                    },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: '$completionRate' } } },
      ]);
      avgCompletionRate = progressData[0]?.avg != null
        ? Math.round(progressData[0].avg)
        : null;
    }

    // 10 most recent courses with key fields
    const recentCourses = courses
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(c => ({
        _id: c._id,
        title: c.title,
        department: c.department,
        generationStatus: c.generationStatus,
        generationStartedAt: c.generationStartedAt,
        generationCompletedAt: c.generationCompletedAt,
        generationAttempts: c.generationAttempts,
        generationError: c.generationError,
        isPublished: c.isPublished,
        createdAt: c.createdAt,
      }));

    // Attach enrolled student counts to recent courses
    if (recentCourses.length > 0) {
      const recentIds = recentCourses.map(c => c._id);
      const counts = await Enrollment.aggregate([
        { $match: { course: { $in: recentIds }, status: 'approved' } },
        { $group: { _id: '$course', count: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(counts.map(e => [String(e._id), e.count]));
      recentCourses.forEach(c => { c.studentCount = countMap[String(c._id)] ?? 0; });
    }

    res.json({
      status: 'success',
      data: {
        generation: {
          totalCourses,
          readyCourses: readyCourses.length,
          failedCourses: failedCourses.length,
          generatingCourses: generatingCourses.length,
          pendingCourses: pendingCourses.length,
          successRate,
          avgGenerationMs,
          totalAttempts,
        },
        enrollments: {
          totalStudents: approvedEnrollments,
          approvedEnrollments,
          pendingEnrollments,
          deniedEnrollments,
          totalEnrollments,
          approvalRate,
        },
        content: {
          totalNodes,
          totalLessons,
          totalQuizzes,
          avgNodesPerCourse,
          totalQuestionEdits,
        },
        engagement: {
          avgCompletionRate,
        },
        recentCourses,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
