import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import { DEMO_COURSE_TITLES } from '../constants/config.js';

/**
 * Creates a Progress record for a student entering a course.
 * Uses upsert so it is safe to call multiple times.
 *
 * @param {string|object} studentId
 * @param {string|object} courseId
 */
export const createInitialProgress = async (studentId, courseId) => {
  const firstNode = await CourseNode.findOne({ course: courseId }).sort({ order: 1 });
  await Progress.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      student: studentId,
      course: courseId,
      currentNode: firstNode?._id || null,
      completedNodes: [],
      totalXP: 0,
      streak: 0,
    },
    { upsert: true, new: true }
  );
};

/**
 * Auto-enrolls a student in the two demo courses if they don't already have
 * an approved enrollment. Called during course listing for student views.
 *
 * @param {string|object} studentId
 * @param {object} enrollmentMap - mutable map of courseId → enrollment status
 */
export const ensureDemoEnrollments = async (studentId, enrollmentMap) => {
  const demoCourses = await Course.find({ title: { $in: DEMO_COURSE_TITLES } });

  for (const dc of demoCourses) {
    const courseIdStr = dc._id.toString();
    if (enrollmentMap[courseIdStr] === 'approved') continue;

    let enrollment = await Enrollment.findOne({ student: studentId, course: dc._id });

    if (!enrollment) {
      enrollment = await Enrollment.create({
        student: studentId,
        course: dc._id,
        status: 'approved',
        requestedAt: new Date(),
        respondedAt: new Date(),
      });
    } else if (enrollment.status !== 'approved') {
      enrollment.status = 'approved';
      await enrollment.save();
    }

    enrollmentMap[courseIdStr] = 'approved';
    await createInitialProgress(studentId, dc._id);
  }
};
