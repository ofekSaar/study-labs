import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  requestEnrollment,
  getMyEnrollments,
  getCourseEnrollments,
  approveEnrollment,
  denyEnrollment,
  getPendingEnrollments,
  addStudentToCourse,
} from '../controllers/enrollmentController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Course enrollment management
 */

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Request enrollment in a course (Student only)
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: ID of the course to enroll in
 *     responses:
 *       201:
 *         description: Enrollment request created
 *       400:
 *         description: Already enrolled or pending
 *       404:
 *         description: Course not found
 */
router.post(
  '/',
  authenticate,
  authorize('student'),
  [body('courseId').notEmpty().withMessage('Course ID is required')],
  validate,
  requestEnrollment
);

/**
 * @swagger
 * /api/enrollments/my:
 *   get:
 *     summary: Get my enrollment requests + statuses (Student only)
 *     tags: [Enrollments]
 *     responses:
 *       200:
 *         description: List of enrollment requests
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
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Enrollment'
 */
router.get('/my', authenticate, authorize('student'), getMyEnrollments);

/**
 * @swagger
 * /api/enrollments/course/{courseId}:
 *   get:
 *     summary: Get enrollment requests for a course (Instructor only)
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, denied]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of enrollment requests for the course
 *       403:
 *         description: Not course owner
 */
router.get(
  '/course/:courseId',
  authenticate,
  authorize('instructor'),
  getCourseEnrollments
);

/**
 * @swagger
 * /api/enrollments/{id}/approve:
 *   put:
 *     summary: Approve an enrollment request (Instructor only)
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment approved
 *       400:
 *         description: Cannot approve (not pending)
 *       403:
 *         description: Not course owner
 */
router.put('/:id/approve', authenticate, authorize('instructor'), approveEnrollment);

/**
 * @swagger
 * /api/enrollments/{id}/deny:
 *   put:
 *     summary: Deny an enrollment request (Instructor only)
 *     tags: [Enrollments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment denied
 *       400:
 *         description: Cannot deny (not pending)
 *       403:
 *         description: Not course owner
 */
router.put('/:id/deny', authenticate, authorize('instructor'), denyEnrollment);

router.get('/pending-all', authenticate, authorize('instructor'), getPendingEnrollments);

router.post(
  '/add-student',
  authenticate,
  authorize('instructor'),
  [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('studentEmail').isEmail().withMessage('Valid student email is required'),
  ],
  validate,
  addStudentToCourse
);

export default router;
