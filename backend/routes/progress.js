import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  getStats,
  getCourseProgress,
  completeNode,
  getGlobalLeaderboard,
  getCourseLeaderboard,
  getGamificationState,
  syncGamificationState,
  buyShopItem,
  updateActiveCustomizations,
  claimQuest,
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

// Gamification persistence and customization endpoints
router.get('/gamification', authenticate, getGamificationState);
router.put('/gamification/sync', authenticate, syncGamificationState);
router.post('/gamification/shop/buy', authenticate, buyShopItem);
router.put('/gamification/active', authenticate, updateActiveCustomizations);
// Claim a completed quest's reward (server validates progress + pays canonical XP)
router.post('/quests/:questId/claim', authenticate, authorize('student'), claimQuest);

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
  authorize('student', 'instructor'),
  [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('nodeId').notEmpty().withMessage('Node ID is required'),
  ],
  validate,
  completeNode
);

/**
 * @swagger
 * /api/progress/leaderboard:
 *   get:
 *     summary: Global leaderboard ranked by total XP across all courses
 *     tags: [Progress]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, allTime]
 *         description: >
 *           Time window for ranking. weekly/monthly aggregate XpEvent records
 *           within the window; allTime (default) uses cumulative Progress totals.
 *     responses:
 *       200:
 *         description: Leaderboard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: number
 *                       userId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       xp:
 *                         type: number
 *                       level:
 *                         type: string
 *                       isYou:
 *                         type: boolean
 */
router.get('/leaderboard', authenticate, getGlobalLeaderboard);

/**
 * @swagger
 * /api/progress/course/{courseId}/leaderboard:
 *   get:
 *     summary: Course-scoped leaderboard ranked by per-course XP
 *     tags: [Progress]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, allTime]
 *         description: >
 *           Time window for ranking. weekly/monthly aggregate XpEvent records
 *           within the window; allTime (default) uses cumulative Progress totals.
 *     responses:
 *       200:
 *         description: Course leaderboard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: number
 *                       userId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       xp:
 *                         type: number
 *                       level:
 *                         type: string
 *                       isYou:
 *                         type: boolean
 */
router.get('/course/:courseId/leaderboard', authenticate, getCourseLeaderboard);

export default router;
