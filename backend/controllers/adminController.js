import createError from 'http-errors';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import Progress from '../models/Progress.js';
import Enrollment from '../models/Enrollment.js';
import XpEvent from '../models/XpEvent.js';
import SystemConfig, { DEFAULT_SHOP_PRICES } from '../models/SystemConfig.js';

/**
 * GET /api/admin/stats
 * Platform-wide overview counts.
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalCourses, pendingEnrollments, xpResult] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments({ status: 'pending' }),
      XpEvent.aggregate([{ $group: { _id: null, total: { $sum: '$xpAwarded' } } }]),
    ]);

    const roleBreakdown = await User.aggregate([
      { $unwind: { path: '$roles', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$roles', count: { $sum: 1 } } },
    ]);

    const coursesByStatus = await Course.aggregate([
      { $group: { _id: '$generationStatus', count: { $sum: 1 } } },
    ]);

    res.json({
      status: 'success',
      data: {
        totalUsers,
        totalCourses,
        pendingEnrollments,
        totalXpAwarded: xpResult[0]?.total ?? 0,
        roleBreakdown,
        coursesByStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users?page=1&limit=20&search=
 * Paginated user list with stats.
 */
export const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const search = req.query.search?.trim();

    const safeSearch = search ? search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null;
    const filter = safeSearch
      ? { $or: [{ name: { $regex: safeSearch, $options: 'i' } }, { email: { $regex: safeSearch, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email roles role coins stats createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      status: 'success',
      data: { users, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Replace a user's roles array.
 */
export const setUserRoles = async (req, res, next) => {
  try {
    const { roles } = req.body;
    if (!Array.isArray(roles)) return next(createError(400, 'roles must be an array'));

    const allowed = ['student', 'instructor', 'admin'];
    if (roles.some(r => !allowed.includes(r))) {
      return next(createError(400, `Invalid role. Allowed: ${allowed.join(', ')}`));
    }

    // Prevent demoting yourself
    if (req.params.id === String(req.user._id) && !roles.includes('admin')) {
      return next(createError(400, 'Cannot remove your own admin role'));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { roles, role: roles[0] ?? null },
      { new: true, select: 'name email roles role' }
    );
    if (!user) return next(createError(404, 'User not found'));

    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete user and cascade their progress/enrollments.
 */
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return next(createError(400, 'Cannot delete your own account'));
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, 'User not found'));

    await Promise.all([
      Progress.deleteMany({ student: user._id }),
      Enrollment.deleteMany({ student: user._id }),
      XpEvent.deleteMany({ student: user._id }),
      user.deleteOne(),
    ]);

    res.json({ status: 'success', data: { message: 'User deleted' } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/courses?page=1&limit=20&search=
 * All courses regardless of published status.
 */
export const getCourses = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const search = req.query.search?.trim();

    const safeSearch = search ? search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null;
    const filter = safeSearch
      ? { title: { $regex: safeSearch, $options: 'i' } }
      : {};

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor', 'name email')
        .select('title department generationStatus isPublished createdAt instructor')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    // Attach enrollment counts
    const courseIds = courses.map(c => c._id);
    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, status: 'approved' } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(enrollmentCounts.map(e => [String(e._id), e.count]));

    const result = courses.map(c => ({
      ...c.toObject(),
      enrolledCount: countMap[String(c._id)] ?? 0,
    }));

    res.json({
      status: 'success',
      data: { courses: result, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/courses/:id/publish
 * Toggle isPublished.
 */
export const toggleCoursePublished = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return next(createError(404, 'Course not found'));

    course.isPublished = !course.isPublished;
    await course.save();

    res.json({ status: 'success', data: { isPublished: course.isPublished } });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/courses/:id
 * Force-delete course and cascade nodes/progress/enrollments.
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return next(createError(404, 'Course not found'));

    await Promise.all([
      CourseNode.deleteMany({ course: course._id }),
      Progress.deleteMany({ course: course._id }),
      Enrollment.deleteMany({ course: course._id }),
      XpEvent.deleteMany({ course: course._id }),
      course.deleteOne(),
    ]);

    res.json({ status: 'success', data: { message: 'Course deleted' } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/shop/prices
 * Return current shop item prices.
 */
export const getShopPrices = async (req, res, next) => {
  try {
    const config = await SystemConfig.findOne({ key: 'shopPrices' });
    res.json({
      status: 'success',
      data: { prices: config ? config.value : DEFAULT_SHOP_PRICES },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/instructors
 * List all instructors with aggregated course/student stats.
 */
export const getInstructors = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const filter = {
      $or: [{ roles: 'instructor' }, { role: 'instructor' }],
      ...(search
        ? { $and: [{ $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }] }
        : {}),
    };

    const instructors = await User.find(filter)
      .select('name email avatar photoUrl roles role createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const instructorIds = instructors.map(u => u._id);

    const [courseStats, enrollmentStats] = await Promise.all([
      Course.aggregate([
        { $match: { instructor: { $in: instructorIds } } },
        {
          $group: {
            _id: '$instructor',
            totalCourses: { $sum: 1 },
            readyCourses: { $sum: { $cond: [{ $eq: ['$generationStatus', 'ready'] }, 1, 0] } },
            failedCourses: { $sum: { $cond: [{ $eq: ['$generationStatus', 'failed'] }, 1, 0] } },
          },
        },
      ]),
      Enrollment.aggregate([
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'courseDoc',
          },
        },
        { $unwind: '$courseDoc' },
        { $match: { 'courseDoc.instructor': { $in: instructorIds }, status: 'approved' } },
        { $group: { _id: '$courseDoc.instructor', studentCount: { $sum: 1 } } },
      ]),
    ]);

    const courseMap = Object.fromEntries(courseStats.map(s => [String(s._id), s]));
    const studentMap = Object.fromEntries(enrollmentStats.map(s => [String(s._id), s.studentCount]));

    const result = instructors.map(u => {
      const cs = courseMap[String(u._id)] ?? { totalCourses: 0, readyCourses: 0, failedCourses: 0 };
      return {
        ...u,
        stats: {
          totalCourses: cs.totalCourses,
          readyCourses: cs.readyCourses,
          failedCourses: cs.failedCourses,
          successRate: cs.totalCourses > 0
            ? Math.round((cs.readyCourses / cs.totalCourses) * 100)
            : null,
          totalStudents: studentMap[String(u._id)] ?? 0,
        },
      };
    });

    res.json({ status: 'success', data: { instructors: result, total: result.length } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/shop/prices
 * Update shop item prices.
 */
export const updateShopPrices = async (req, res, next) => {
  try {
    const { prices } = req.body;
    if (!prices || typeof prices !== 'object') {
      return next(createError(400, 'prices object is required'));
    }

    const config = await SystemConfig.findOneAndUpdate(
      { key: 'shopPrices' },
      { value: prices, updatedBy: req.user._id },
      { upsert: true, new: true }
    );

    res.json({ status: 'success', data: { prices: config.value } });
  } catch (err) {
    next(err);
  }
};
