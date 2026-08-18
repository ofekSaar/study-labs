import createError from 'http-errors';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { assertOwner } from '../middleware/ownershipGuard.js';
import { createInitialProgress } from '../services/enrollmentService.js';
import { getIO } from '../config/socket.js';

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
          .populate('student', 'name email avatar photoUrl');

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

    if (isInstructor) {
      await createInitialProgress(req.user._id, courseId);
    }

    const populated = await Enrollment.findById(enrollment._id)
      .populate('course', 'title color level')
      .populate('student', 'name email avatar photoUrl');

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
        populate: { path: 'instructor', select: 'name avatar photoUrl' },
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

    assertOwner(course, 'instructor', req.user._id, 'Access denied');

    const { status } = req.query;
    const validStatuses = ['pending', 'approved', 'denied'];
    if (status && !validStatuses.includes(status)) {
      throw createError(400, 'Invalid status filter');
    }
    const query = { course: req.params.courseId };
    if (status) query.status = status;

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name email avatar photoUrl')
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

    assertOwner(enrollment.course, 'instructor', req.user._id, 'Access denied');

    if (enrollment.status !== 'pending') {
      throw createError(400, `Cannot approve enrollment with status "${enrollment.status}"`);
    }

    enrollment.status = 'approved';
    enrollment.respondedAt = new Date();
    await enrollment.save();

    await createInitialProgress(enrollment.student, enrollment.course._id);

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'name email avatar photoUrl')
      .populate('course', 'title');

    // Notify the student in real-time
    const io = getIO();
    if (io) {
      io.to(`user_${enrollment.student}`).emit('student_notification', {
        type: 'enrollment_approved',
        message: `You were approved to join "${populated.course.title}"`,
        courseTitle: populated.course.title,
        courseId: enrollment.course._id.toString(),
        createdAt: new Date(),
      });
    }

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

    assertOwner(enrollment.course, 'instructor', req.user._id, 'Access denied');

    if (enrollment.status !== 'pending') {
      throw createError(400, `Cannot deny enrollment with status "${enrollment.status}"`);
    }

    enrollment.status = 'denied';
    enrollment.respondedAt = new Date();
    await enrollment.save();

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'name email avatar photoUrl')
      .populate('course', 'title');

    // Notify the student in real-time
    const io = getIO();
    if (io) {
      io.to(`user_${enrollment.student}`).emit('student_notification', {
        type: 'enrollment_denied',
        message: `Your request to join "${populated.course.title}" was not approved.`,
        courseTitle: populated.course.title,
        courseId: enrollment.course._id.toString(),
        createdAt: new Date(),
      });
    }

    res.json({ status: 'success', data: { enrollment: populated } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending enrollments across all instructor's courses (Instructor only).
 */
export const getPendingEnrollments = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }, '_id');
    const courseIds = courses.map(c => c._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds }, status: 'pending' })
      .populate('student', 'name email avatar photoUrl')
      .populate('course', 'title color')
      .sort({ requestedAt: -1 });

    res.json({ status: 'success', data: { enrollments } });
  } catch (error) {
    next(error);
  }
};

/**
 * Instructor directly adds a student to a course by email (Instructor only).
 */
export const addStudentToCourse = async (req, res, next) => {
  try {
    const { courseId, studentEmail } = req.body;

    const course = await Course.findById(courseId);
    if (!course) throw createError(404, 'Course not found');
    assertOwner(course, 'instructor', req.user._id, 'Access denied');

    const student = await User.findOne({ email: studentEmail.toLowerCase().trim() });
    if (!student) throw createError(404, 'No user found with that email address');
    if (!student.roles.includes('student') && student.role !== 'student') {
      throw createError(400, 'This user is not registered as a student');
    }

    const existing = await Enrollment.findOne({ student: student._id, course: courseId });
    if (existing?.status === 'approved') {
      throw createError(400, 'Student is already enrolled in this course');
    }

    let enrollment;
    if (existing) {
      existing.status = 'approved';
      existing.respondedAt = new Date();
      await existing.save();
      enrollment = existing;
    } else {
      enrollment = await Enrollment.create({
        student: student._id,
        course: courseId,
        status: 'approved',
        requestedAt: new Date(),
        respondedAt: new Date(),
      });
    }

    await createInitialProgress(student._id, courseId);

    const populated = await Enrollment.findById(enrollment._id)
      .populate('student', 'name email avatar photoUrl')
      .populate('course', 'title');

    res.status(201).json({ status: 'success', data: { enrollment: populated } });
  } catch (error) {
    next(error);
  }
};

/**
 * Search students by name or email (Instructor only).
 */
export const searchStudents = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 2) {
      return res.json({ status: 'success', data: { students: [] } });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const students = await User.find({
      $and: [
        {
          $or: [
            { roles: 'student' },
            { role: 'student' }
          ]
        },
        {
          $or: [
            { name: searchRegex },
            { email: searchRegex }
          ]
        }
      ]
    })
    .select('name email avatar')
    .limit(10);

    res.json({ status: 'success', data: { students } });
  } catch (error) {
    next(error);
  }
};
