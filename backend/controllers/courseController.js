import createError from 'http-errors';
import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import storage from '../services/storage/index.js';
import { generateRoadmap } from '../services/aiService.js';

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
    // Check if user has roles array (multi-role support)
    const userRoles = req.user?.roles || (req.user?.role ? [req.user.role] : []);
    const isInstructor = userRoles.includes('instructor');
    const isStudent = userRoles.includes('student');

    // Determine query based on role and optional filter
    // For instructors viewing their dashboard: show only their courses
    // For students (or multi-role users browsing as students): show all published courses
    let query;

    if (isInstructor && !isStudent) {
      // Pure instructor: show only their courses
      query = { instructor: req.user._id };
    } else if (isInstructor && isStudent) {
      // Multi-role user: check which view they're in via query param
      const view = req.query.view;
      if (view === 'instructor') {
        query = { instructor: req.user._id };
      } else {
        // Default to student view (all published courses)
        query = { isPublished: true };
      }
    } else {
      // Pure student: show all published courses
      query = { isPublished: true };
    }

    const courses = await Course.find(query)
      .populate('instructor', 'name email avatar')
      .select('-materials')
      .sort({ createdAt: -1 });

    // If user has student role, include enrollment status for all courses
    if (isStudent) {
      const enrollments = await Enrollment.find({
        student: req.user._id,
        course: { $in: courses.map((c) => c._id) },
      });

      const enrollmentMap = {};
      enrollments.forEach((e) => {
        enrollmentMap[e.course.toString()] = e.status;
      });

      const coursesWithStatus = courses.map((course) => ({
        ...course.toObject(),
        enrollmentStatus: enrollmentMap[course._id.toString()] || null,
      }));

      return res.json({ status: 'success', data: { courses: coursesWithStatus } });
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
      data: {
        course: { ...course.toObject(), nodeCount },
      },
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

    // Upload materials to storage
    let syllabusData = null;
    const materialsData = [];

    // Process syllabus
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

    // Process other materials (filter duplicates by name and size)
    if (req.files && req.files.materials && req.files.materials.length > 0) {
      const seenFiles = new Set();

      for (const file of req.files.materials) {
        const fileSignature = `${file.originalname}_${file.size}`;

        // Skip duplicate files
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
    });

    // Return immediately — don't wait for AI pipeline
    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name email avatar');

    res.status(201).json({
      status: 'success',
      data: { course: populatedCourse },
    });

    // ── Background AI Generation (fire-and-forget) ──────────
    generateRoadmapInBackground(course, syllabusData, materialsData, title, description, analyzeImages === 'true');

  } catch (error) {
    next(error);
  }
};

/**
 * Runs the AI roadmap generation in the background.
 * Updates course status when complete or on failure.
 */
async function generateRoadmapInBackground(course, syllabusData, materialsData, title, description, analyzeImages = false) {
  try {
    console.log(`[Background] Starting AI generation for course ${course._id}...`);

    const roadmapResult = await generateRoadmap({
      courseId: course._id.toString(),
      title,
      description,
      syllabus: syllabusData.storagePath,
      materials: materialsData.map((m) => m.storagePath),
      aiConfig: course.aiConfig,
      analyzeImages,
    });

    // Create course nodes from AI-generated roadmap
    if (roadmapResult.nodes && roadmapResult.nodes.length > 0) {
      const nodes = roadmapResult.nodes.map((node, index) => ({
        course: course._id,
        title: node.title,
        type: node.type,
        order: index,
        estimatedMinutes: node.estimatedMinutes || 45,
        xpReward: node.xpReward || 150,
        lessonContent: node.lessonContent || null,
        quizData: node.quizData || undefined,
      }));

      // Save lesson markdown content to storage
      for (const nodeData of nodes) {
        if (nodeData.lessonContent) {
          const mdResult = await storage.uploadContent(
            nodeData.lessonContent,
            `${nodeData.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`,
            `lessons/${course._id}`
          );
          nodeData.lessonContentPath = mdResult.storagePath;
        }
      }

      await CourseNode.insertMany(nodes);
    } else {
      throw new Error('AI failed to generate any lessons. The syllabus might be empty or too complex.');
    }

    // Publish the course & mark as ready
    course.isPublished = true;
    course.generationStatus = 'ready';
    course.generationError = null;
    await course.save();

    console.log(`[Background] ✅ Course ${course._id} generation complete! ${roadmapResult.nodes?.length || 0} nodes created.`);
  } catch (error) {
    console.error(`[Background] ❌ Course ${course._id} generation failed:`, error.message);
    course.generationStatus = 'failed';
    course.generationError = error.message;
    course.isPublished = false; // Do not publish failed courses
    await course.save();
  }
}

/**
 * Update a course (Instructor owner only).
 */
export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw createError(404, 'Course not found');

    if (course.instructor.toString() !== req.user._id.toString()) {
      throw createError(403, 'You can only edit your own courses');
    }

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

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('instructor', 'name email avatar');

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

    if (course.instructor.toString() !== req.user._id.toString()) {
      throw createError(403, 'You can only delete your own courses');
    }

    // Clean up materials from storage (parallel)
    await Promise.all(
      course.materials.map(material => storage.delete(material.storagePath))
    );

    // Clean up lesson markdown files (parallel)
    const nodes = await CourseNode.find({ course: course._id });
    const contentPaths = nodes.map(n => n.lessonContentPath).filter(Boolean);
    
    await Promise.all(
      contentPaths.map(path => storage.delete(path))
    );

    // Delete related data
    await CourseNode.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id });
    await Progress.deleteMany({ course: course._id });

    // Delete quiz attempts for this course's nodes
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

    // If user has student role (check roles array for multi-role support), include progress status per node
    const userRoles = req.user?.roles || (req.user?.role ? [req.user.role] : []);
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

      nodesWithStatus = nodesWithStatus.map((node) => {
        let status = 'locked';
        if (completedIds.has(node._id.toString())) {
          status = 'completed';
        } else if (node._id.toString() === currentNodeId) {
          status = 'current';
        } else if (node.order === 0 && completedIds.size === 0 && !currentNodeId) {
          // First node is always active if no progress
          status = 'current';
        }
        return { ...node, status };
      });
    }

    res.json({
      status: 'success',
      data: {
        nodes: nodesWithStatus,
        course: { title: course.title, level: course.level, color: course.color },
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

    // If content is stored in file, read it
    if (!content && node.lessonContentPath) {
      content = await storage.readContent(node.lessonContentPath);
    }

    res.json({
      status: 'success',
      data: {
        nodeId: node._id,
        title: node.title,
        type: node.type,
        content: content || '',
      },
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

    if (course.instructor.toString() !== req.user._id.toString()) {
      throw createError(403, 'You can only edit your own courses');
    }

    const node = await CourseNode.findOne({
      _id: req.params.nodeId,
      course: req.params.id,
    });
    if (!node) throw createError(404, 'Node not found');

    const { content } = req.body;
    if (content === undefined) throw createError(400, 'Content is required');

    // Save to storage
    if (node.lessonContentPath) {
      // Delete old file
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

    res.json({
      status: 'success',
      data: { nodeId: node._id, content },
    });
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

    if (course.instructor.toString() !== req.user._id.toString()) {
      throw createError(403, 'Access denied');
    }

    // Total enrolled students
    const totalStudents = await Enrollment.countDocuments({
      course: course._id,
      status: 'approved',
    });

    // Get all progress records for this course
    const progressRecords = await Progress.find({ course: course._id })
      .populate('student', 'name email avatar');

    const nodes = await CourseNode.find({ course: course._id }).sort({ order: 1 });
    const totalNodes = nodes.length;

    // Calculate average completion
    let totalCompletion = 0;
    progressRecords.forEach((p) => {
      totalCompletion += totalNodes > 0
        ? (p.completedNodes.length / totalNodes) * 100
        : 0;
    });
    const avgCompletion = totalStudents > 0
      ? Math.round(totalCompletion / totalStudents)
      : 0;

    // Total class XP
    const totalXP = progressRecords.reduce((sum, p) => sum + p.totalXP, 0);

    // At-risk students (less than 25% completion or inactive for 5+ days)
    const atRiskStudents = progressRecords
      .filter((p) => {
        const completion = totalNodes > 0
          ? (p.completedNodes.length / totalNodes) * 100
          : 0;
        const daysSinceActive = p.lastActivityDate
          ? Math.floor((Date.now() - p.lastActivityDate) / (1000 * 60 * 60 * 24))
          : 999;
        return completion < 25 || daysSinceActive > 5;
      })
      .map((p) => ({
        student: p.student,
        completion: totalNodes > 0
          ? Math.round((p.completedNodes.length / totalNodes) * 100)
          : 0,
        daysSinceActive: p.lastActivityDate
          ? Math.floor((Date.now() - p.lastActivityDate) / (1000 * 60 * 60 * 24))
          : null,
        issue: !p.lastActivityDate
          ? 'Never started'
          : Math.floor((Date.now() - p.lastActivityDate) / (1000 * 60 * 60 * 24)) > 5
            ? `Inactive for ${Math.floor((Date.now() - p.lastActivityDate) / (1000 * 60 * 60 * 24))} days`
            : 'Low progress',
      }));

    // Calculate node completion frequencies once (O(N) instead of N^2)
    const nodeCompletionCounts = {};
    progressRecords.forEach((p) => {
      p.completedNodes.forEach((nodeId) => {
        const idStr = nodeId.toString();
        nodeCompletionCounts[idStr] = (nodeCompletionCounts[idStr] || 0) + 1;
      });
    });

    // Class progress per node (how many students reached each node)
    const nodeProgress = nodes.map((node) => {
      return {
        name: node.title,
        students: nodeCompletionCounts[node._id.toString()] || 0,
      };
    });

    res.json({
      status: 'success',
      data: {
        metrics: {
          totalStudents,
          avgCompletion,
          activeModules: totalNodes,
          totalXP,
        },
        nodeProgress,
        atRiskStudents,
      },
    });
  } catch (error) {
    next(error);
  }
};
