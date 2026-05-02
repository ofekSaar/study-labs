import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  getStats,
  getCourseProgress,
  completeNode,
} from '../controllers/progressController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Progress
 *   description: Student progress tracking
 */

/**
 * @swagger
 * /api/progress/stats:
 *   get:
 *     summary: Get aggregate student stats (totalXP, streak, level)
 *     tags: [Progress]
 *     responses:
 *       200:
 *         description: Student statistics
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
 *                     totalXP:
 *                       type: number
 *                     streak:
 *                       type: number
 *                     levelName:
 *                       type: string
 *                     coursesInProgress:
 *                       type: number
 */
router.get('/stats', authenticate, authorize('student'), getStats);

/**
 * @swagger
 * /api/progress/course/{courseId}:
 *   get:
 *     summary: Get progress for a specific course
 *     tags: [Progress]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course progress data
 *       403:
 *         description: Not enrolled in this course
 */
router.get('/course/:courseId', authenticate, authorize('student'), getCourseProgress);

/**
 * @swagger
 * /api/progress/complete-node:
 *   post:
 *     summary: Mark node as completed, award XP
 *     tags: [Progress]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - nodeId
 *             properties:
 *               courseId:
 *                 type: string
 *               nodeId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Node completed, XP awarded
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
 *                     xpEarned:
 *                       type: number
 *                     totalXP:
 *                       type: number
 *                     streak:
 *                       type: number
 *                     percentComplete:
 *                       type: number
 *       400:
 *         description: Node already completed
 *       403:
 *         description: Not enrolled
 */
router.post(
  '/complete-node',
  authenticate,
  authorize('student'),
  [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('nodeId').notEmpty().withMessage('Node ID is required'),
  ],
  validate,
  completeNode
);

export default router;
