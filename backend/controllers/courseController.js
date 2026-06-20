import createError from 'http-errors';
import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import storage from '../services/storage/index.js';
import { generateRoadmapInBackground } from '../services/courseGenerationService.js';
import { buildCourseAnalytics } from '../services/analyticsService.js';
import { ensureDemoEnrollments, createInitialProgress } from '../services/enrollmentService.js';
import { assertOwner } from '../middleware/ownershipGuard.js';
import { getUserRoles } from '../utils/userRoles.js';
import { STUCK_GENERATION_THRESHOLD_MS, MAX_GENERATION_ATTEMPTS } from '../constants/config.js';

const safeJSONParse = (str, fieldName) => {
  if (!str) return undefined;
  try {
    return JSON.parse(str);
  } catch (error) {
    throw createError(400, `Invalid JSON format in field: ${fieldName}`);
  }
};

/**
 * List all published courses.
 */
export const listCourses = async (req, res, next) => {
  try {
    const userRoles = getUserRoles(req.user);
    const isInstructor = userRoles.includes('instructor');
    const isStudent = userRoles.includes('student');

    let query;
    if (isInstructor && !isStudent) {
      query = { instructor: req.user._id };
    } else if (isInstructor && isStudent) {
      query = req.query.view === 'instructor'
        ? { instructor: req.user._id }
        : { isPublished: true };
    } else {
      query = { isPublished: true };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email avatar')
      .select('-materials')
      .sort({ createdAt: -1 });

    if (isStudent) {
      const enrollments = await Enrollment.find({
        student: req.user._id,
        course: { $in: courses.map((c) => c._id) },
      });

      const enrollmentMap = {};
      enrollments.forEach((e) => {
        enrollmentMap[e.course.toString()] = e.status;
      });

      await ensureDemoEnrollments(req.user._id, enrollmentMap);

      const coursesWithStatus = courses.map((course) => ({
        ...course.toObject(),
        enrollmentStatus: enrollmentMap[course._id.toString()] || null,
      }));

      return res.json({ status: 'success', data: { courses: coursesWithStatus } });
    }

    if (isInstructor && req.query.view === 'instructor') {
      const coursesWithCount = await Promise.all(courses.map(async (course) => {
        const studentCount = await Enrollment.countDocuments({
          course: course._id,
          status: 'approved',
        });
        return { ...course.toObject(), studentCount };
      }));
      return res.json({ status: 'success', data: { courses: coursesWithCount } });
    }

    res.json({ status: 'success', data: { courses } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single course with node count.
 */
export const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email avatar');

    if (!course) throw createError(404, 'Course not found');

    const nodeCount = await CourseNode.countDocuments({ course: course._id });

    res.json({
      status: 'success',
      data: { course: { ...course.toObject(), nodeCount } },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new course (Instructor only).
 * Handles multipart form data with file uploads.
 */
export const createCourse = async (req, res, next) => {
  try {
    const { title, department, description, aiConfig, gamification, analyzeImages } = req.body;

    let syllabusData = null;
    const materialsData = [];

    if (req.files && req.files.syllabus && req.files.syllabus.length > 0) {
      const file = req.files.syllabus[0];
      const result = await storage.upload(file, 'materials');
      syllabusData = {
        filename: result.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        storagePath: result.storagePath,
        size: file.size,
      };
    } else {
      throw createError(400, 'Syllabus is required');
    }

    if (req.files && req.files.materials && req.files.materials.length > 0) {
      const seenFiles = new Set();
      for (const file of req.files.materials) {
        const fileSignature = `${file.originalname}_${file.size}`;
        if (seenFiles.has(fileSignature)) {
          console.log(`[Course Upload] Skipping duplicate file: ${file.originalname}`);
          continue;
        }
        seenFiles.add(fileSignature);
        const result = await storage.upload(file, 'materials');
        materialsData.push({
          filename: result.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          storagePath: result.storagePath,
          size: file.size,
        });
      }
    }

    const course = await Course.create({
      title,
      department,
      description,
      instructor: req.user._id,
      syllabus: syllabusData,
      materials: materialsData,
      aiConfig: safeJSONParse(aiConfig, 'aiConfig'),
      gamification: safeJSONParse(gamification, 'gamification'),
      isPublished: false,
      generationStatus: 'generating',
      generationStartedAt: new Date(),
      generationAttempts: 1,
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name email avatar');

    res.status(201).json({
      status: 'success',
      data: { course: populatedCourse },
    });

    generateRoadmapInBackground(course, syllabusData, materialsData, title, description, analyzeImages === 'true');
  } catch (error) {
    next(error);
  }
};

/**
 * Retry course generation (Instructor owner only).
 */
export const regenerateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw createError(404, 'Course not found');

    assertOwner(course, 'instructor', req.user._id, 'You can only regenerate your own courses');

    if (course.generationAttempts >= MAX_GENERATION_ATTEMPTS) {
      throw createError(
        409,
        `Course generation has already been attempted ${course.generationAttempts} times ` +
          `(max ${MAX_GENERATION_ATTEMPTS}: 1 initial + 1 retry). No further retries are allowed.`
      );
    }

    const isStuckGenerating =
      course.generationStatus === 'generating' &&
      course.generationStartedAt &&
      Date.now() - course.generationStartedAt.getTime() > STUCK_GENERATION_THRESHOLD_MS;

    const isRetriable = course.generationStatus === 'failed' || isStuckGenerating;

    if (!isRetriable) {
      throw createError(
        409,
        `Course cannot be regenerated in its current state ('${course.generationStatus}'). ` +
          'Only failed or stuck courses may be retried.'
      );
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      course._id,
      {
        $set: {
          generationStatus: 'generating',
          generationError: null,
          generationStartedAt: new Date(),
          isPublished: false,
        },
        $inc: { generationAttempts: 1 },
      },
      { new: true }
    );

    res.json({
      status: 'success',
      message: 'Course regeneration started.',
      data: {
        courseId: updatedCourse._id,
        generationAttempts: updatedCourse.generationAttempts,
      },
    });

    generateRoadmapInBackground(
      updatedCourse,
      course.syllabus,
      course.materials,
      course.title,
      course.description,
      false
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update a course (Instructor owner only).
 */
export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw createError(404, 'Course not found');

    assertOwner(course, 'instructor', req.user._id, 'You can only edit your own courses');

    const updates = {};
    const allowedFields = ['title', 'department', 'description', 'color', 'level', 'isPublished'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.aiConfig !== undefined) {
      updates.aiConfig = safeJSONParse(req.body.aiConfig, 'aiConfig');
    }
    if (req.body.gamification !== undefined) {
      updates.gamification = safeJSONParse(req.body.gamification, 'gamification');
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('instructor', 'name email avatar');

    res.json({ status: 'success', data: { course: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course and all related data (Instructor owner only).
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw createError(404, 'Course not found');

    assertOwner(course, 'instructor', req.user._id, 'You can only delete your own courses');

    await Promise.all(course.materials.map((material) => storage.delete(material.storagePath)));

    const nodes = await CourseNode.find({ course: course._id });
    const contentPaths = nodes.map((n) => n.lessonContentPath).filter(Boolean);
    await Promise.all(contentPaths.map((p) => storage.delete(p)));

    await CourseNode.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id });
    await Progress.deleteMany({ course: course._id });

    const nodeIds = nodes.map((n) => n._id);
    await QuizAttempt.deleteMany({ courseNode: { $in: nodeIds } });

    await Course.findByIdAndDelete(course._id);

    res.json({ status: 'success', message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get course nodes (with student progress if applicable).
 */
export const getCourseNodes = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw createError(404, 'Course not found');

    const nodes = await CourseNode.find({ course: req.params.id })
      .select('-quizData')
      .sort({ order: 1 });

    let nodesWithStatus = nodes.map((n) => n.toObject());

    const userRoles = getUserRoles(req.user);
    const isStudent = userRoles.includes('student');

    if (isStudent) {
      const progress = await Progress.findOne({
        student: req.user._id,
        course: req.params.id,
      });

      const completedIds = new Set(
        (progress?.completedNodes || []).map((id) => id.toString())
      );
      const currentNodeId = progress?.currentNode?.toString();

      // Fetch latest quiz attempt per completed node
      const attempts = await QuizAttempt.find({
        student: req.user._id,
        courseNode: { $in: [...completedIds] },
      }).sort({ completedAt: -1 });

      const attemptMap = {};
      for (const attempt of attempts) {
        const key = attempt.courseNode.toString();
        if (!attemptMap[key]) {
          const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
          const totalAnswerable = attempt.answers.length;
          attemptMap[key] = { correctCount, totalAnswerable };
        }
      }

      nodesWithStatus = nodesWithStatus.map((node) => {
        let status = 'locked';
        if (completedIds.has(node._id.toString())) {
          status = 'completed';
        } else if (node._id.toString() === currentNodeId) {
          status = 'current';
        } else if (node.order === 0 && completedIds.size === 0 && !currentNodeId) {
          status = 'current';
        }
        const quizScore = attemptMap[node._id.toString()] || null;
        return { ...node, status, quizScore };
      });
    }

    res.json({
      status: 'success',
      data: {
        nodes: nodesWithStatus,
        course: {
          title: course.title,
          level: course.level,
          color: course.color,
          generationStatus: course.generationStatus,
          generationError: course.generationError,
          generationProgress: course.generationProgress,
          generationAttempts: course.generationAttempts,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lesson content (markdown) for a specific node.
 */
export const getNodeContent = async (req, res, next) => {
  try {
    const node = await CourseNode.findOne({
      _id: req.params.nodeId,
      course: req.params.id,
    });

    if (!node) throw createError(404, 'Node not found');

    let content = node.lessonContent;
    if (!content && node.lessonContentPath) {
      content = await storage.readContent(node.lessonContentPath);
    }

    res.json({
      status: 'success',
      data: { nodeId: node._id, title: node.title, type: node.type, content: content || '' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update lesson content (markdown) for a specific node.
 */
export const updateNodeContent = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw createError(404, 'Course not found');

    assertOwner(course, 'instructor', req.user._id, 'You can only edit your own courses');

    const node = await CourseNode.findOne({
      _id: req.params.nodeId,
      course: req.params.id,
    });
    if (!node) throw createError(404, 'Node not found');

    const { content } = req.body;
    if (content === undefined) throw createError(400, 'Content is required');

    if (node.lessonContentPath) {
      await storage.delete(node.lessonContentPath);
    }

    const mdResult = await storage.uploadContent(
      content,
      `${node.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`,
      `lessons/${course._id}`
    );

    node.lessonContent = content;
    node.lessonContentPath = mdResult.storagePath;
    await node.save();

    res.json({ status: 'success', data: { nodeId: node._id, content } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all enrolled students with progress for a course (Instructor only).
 */
export const getCourseStudents = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw createError(404, 'Course not found');

    assertOwner(course, 'instructor', req.user._id, 'Access denied');

    const [enrollments, progressRecords, totalNodes] = await Promise.all([
      Enrollment.find({ course: course._id, status: 'approved' }).populate('student', 'name email avatar'),
      Progress.find({ course: course._id }),
      CourseNode.countDocuments({ course: course._id }),
    ]);

    const progressMap = {};
    progressRecords.forEach((p) => {
      progressMap[p.student.toString()] = p;
    });

    const students = enrollments
      .map(({ student }) => {
        const p = progressMap[student._id.toString()];
        const completedNodes = p ? p.completedNodes.length : 0;
        return {
          student: { _id: student._id, name: student.name, email: student.email, avatar: student.avatar },
          completion: totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0,
          completedNodes,
          totalNodes,
          totalXP: p ? p.totalXP : 0,
          streak: p ? p.streak : 0,
          lastActivityDate: p ? p.lastActivityDate : null,
        };
      })
      .sort((a, b) => b.completion - a.completion);

    res.json({ status: 'success', data: { students, totalNodes } });
  } catch (error) {
    next(error);
  }
};

/**
 * Get analytics for a course (Instructor only).
 */
export const getCourseAnalytics = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw createError(404, 'Course not found');

    assertOwner(course, 'instructor', req.user._id, 'Access denied');

    const data = await buildCourseAnalytics(course._id, course);

    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};
