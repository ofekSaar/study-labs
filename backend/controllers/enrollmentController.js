import createError from 'http-errors';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import CourseNode from '../models/CourseNode.js';

/**
 * Request enrollment in a course (Student only).
 */
export const requestEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) throw createError(404, 'Course not found');
    if (!course.isPublished) throw createError(400, 'Course is not published');

    // Check for existing enrollment
    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (existing) {
      if (existing.status === 'approved') {
        throw createError(400, 'You are already enrolled in this course');
      }
      if (existing.status === 'pending') {
        throw createError(400, 'Enrollment request is already pending');
      }
      if (existing.status === 'denied') {
        // Allow re-request after denial
        existing.status = 'pending';
        existing.requestedAt = new Date();
        existing.respondedAt = null;
        await existing.save();

        const populated = await Enrollment.findById(existing._id)
          .populate('course', 'title color level')
          .populate('student', 'name email avatar');

        return res.json({ status: 'success', data: { enrollment: populated } });
      }
    }

    // Auto-approve if student is also the course instructor
    const isInstructor = course.instructor.toString() === req.user._id.toString();

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      status: isInstructor ? 'approved' : 'pending',
      respondedAt: isInstructor ? new Date() : null,
    });

    // If auto-approved, create initial progress record
    if (isInstructor) {
      const firstNode = await CourseNode.findOne({
        course: courseId,
      }).sort({ order: 1 });

      await Progress.create({
        student: req.user._id,
        course: courseId,
        currentNode: firstNode?._id || null,
        completedNodes: [],
        totalXP: 0,
        streak: 0,
      });
    }

    const populated = await Enrollment.findById(enrollment._id)
      .populate('course', 'title color level')
      .populate('student', 'name email avatar');

    res.status(201).json({ status: 'success', data: { enrollment: populated } });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return next(createError(400, 'Enrollment request already exists'));
    }
    next(error);
  }
};

/**
 * Get my enrollment requests + statuses (Student only).
 */
export const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate('course', 'title department color level description instructor')
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name avatar' },
      })
      .sort({ requestedAt: -1 });

    res.json({ status: 'success', data: { enrollments } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get enrollment requests for a course (Instructor only).
 */
export const getCourseEnrollments = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw createError(404, 'Course not found');

    if (course.instructor.toString() !== req.user._id.toString()) {
      throw createError(403, 'Access denied');
    }

    const { status } = req.query;
    const query = { course: req.params.courseId };
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name email avatar')
      .sort({ requestedAt: -1 });

    res.json({ status: 'success', data: { enrollments, course: { title: course.title } } });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve an enrollment request (Instructor only).
 */
export const approveEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course');

    if (!enrollment) throw createError(404, 'Enrollment not found');

    if (enrollment.course.instructor.toString() !== req.user._id.toString()) {
      throw createError(403, 'Access denied');
    }

    if (enrollment.status !== 'pending') {
      throw createError(400, `Cannot approve enrollment with status "${enrollment.status}"`);
    }

    enrollment.status = 'approved';
    enrollment.respondedAt = new Date();
    await enrollment.save();

    // Create initial progress record for the student
    const firstNode = await CourseNode.findOne({
      course: enrollment.course._id,
    }).sort({ order: 1 });

    await Progress.findOneAndUpdate(
      { student: enrollment.student, course: enrollment.course._id },
      {
        student: enrollment.student,
        course: enrollment.course._id,
        currentNode: firstNode?._id || null,
        completedNodes: [],
        totalXP: 0,
        streak: 0,
      },
      { upsert: true, new: true }
    );

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'name email avatar')
      .populate('course', 'title');

    res.json({ status: 'success', data: { enrollment: populated } });
  } catch (error) {
    next(error);
  }
};

/**
 * Deny an enrollment request (Instructor only).
 */
export const denyEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course');

    if (!enrollment) throw createError(404, 'Enrollment not found');

    if (enrollment.course.instructor.toString() !== req.user._id.toString()) {
      throw createError(403, 'Access denied');
    }

    if (enrollment.status !== 'pending') {
      throw createError(400, `Cannot deny enrollment with status "${enrollment.status}"`);
    }

    enrollment.status = 'denied';
    enrollment.respondedAt = new Date();
    await enrollment.save();

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'name email avatar')
      .populate('course', 'title');

    res.json({ status: 'success', data: { enrollment: populated } });
  } catch (error) {
    next(error);
  }
};
