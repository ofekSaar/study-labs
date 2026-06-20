import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseNodes,
  getNodeContent,
  updateNodeContent,
  getCourseAnalytics,
  getCourseStudents,
  regenerateCourse,
} from '../controllers/courseController.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf', 
      'video/mp4',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PPTX, DOCX, XLSX and MP4 files are allowed'), false);
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: List all published courses
 *     tags: [Courses]
 *     security: []
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 */
router.get('/', authenticate, listCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get a single course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', authenticate, getCourse);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course (Instructor only)
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - department
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *                 enum: [cs, math, physics, bio, other]
 *               description:
 *                 type: string
 *               aiConfig:
 *                 type: string
 *                 description: JSON string { nodeCount, quizFrequency }
 *               gamification:
 *                 type: string
 *                 properties:
 *                   syllabus:
 *                     type: string
 *                     format: binary
 *                   materials:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       201:
 *         description: Course created
 *       403:
 *         description: Not authorized (instructor only)
 */
router.post(
  '/',
  authenticate,
  authorize('instructor'),
  (req, res, next) => {
    const maxMaterials = parseInt(process.env.MAX_MATERIALS_COUNT) || 20;
    upload.fields([
      { name: 'syllabus', maxCount: 1 },
      { name: 'materials', maxCount: maxMaterials }
    ])(req, res, next);
  },
  createCourse
);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course (Instructor owner only)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               department:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               level:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated
 *       403:
 *         description: Not course owner
 *       404:
 *         description: Course not found
 */
router.put('/:id', authenticate, authorize('instructor'), updateCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course (Instructor owner only)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted
 *       403:
 *         description: Not course owner
 *       404:
 *         description: Course not found
 */
router.delete('/:id', authenticate, authorize('instructor'), deleteCourse);

/**
 * @swagger
 * /api/courses/{id}/nodes:
 *   get:
 *     summary: Get course nodes (with student progress status)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course nodes with status per node
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     nodes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CourseNode'
 */
router.get('/:id/nodes', authenticate, getCourseNodes);

/**
 * @swagger
 * /api/courses/{id}/nodes/{nodeId}/content:
 *   get:
 *     summary: Get lesson markdown content for a node
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson markdown content
 *       404:
 *         description: Node not found
 */
router.get('/:id/nodes/:nodeId/content', authenticate, getNodeContent);

/**
 * @swagger
 * /api/courses/{id}/nodes/{nodeId}/content:
 *   put:
 *     summary: Update lesson markdown content (Instructor owner only)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Markdown content
 *     responses:
 *       200:
 *         description: Content updated
 *       403:
 *         description: Not course owner
 */
router.put('/:id/nodes/:nodeId/content', authenticate, authorize('instructor'), updateNodeContent);

/**
 * @swagger
 * /api/courses/{id}/analytics:
 *   get:
 *     summary: Get course analytics (Instructor owner only)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics data with metrics, node progress, at-risk students
 *       403:
 *         description: Not course owner
 */
router.get('/:id/analytics', authenticate, authorize('instructor'), getCourseAnalytics);
router.get('/:id/students', authenticate, authorize('instructor'), getCourseStudents);

/**
 * @swagger
 * /api/courses/{courseId}/regenerate:
 *   post:
 *     summary: Retry AI generation for a failed or stuck course (Instructor owner only)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to regenerate
 *     responses:
 *       200:
 *         description: Regeneration started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     courseId:
 *                       type: string
 *                     generationAttempts:
 *                       type: number
 *       403:
 *         description: Not course owner
 *       404:
 *         description: Course not found
 *       409:
 *         description: Course is not in a retriable state
 */
router.post('/:courseId/regenerate', authenticate, authorize('instructor'), regenerateCourse);

export default router;
