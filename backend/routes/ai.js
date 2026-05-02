import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  generateCourseRoadmap,
  evaluateOpenAnswer,
} from '../controllers/aiController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI service proxy endpoints (stub - see AI_SERVICE_CONTRACT.md)
 */

/**
 * @swagger
 * /api/ai/generate-roadmap:
 *   post:
 *     summary: Generate course roadmap from materials (Instructor only)
 *     description: >
 *       Calls the external AI service to generate course nodes.
 *       Currently returns mock data. See AI_SERVICE_CONTRACT.md for full spec.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               courseId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               materials:
 *                 type: array
 *                 items:
 *                   type: string
 *               aiConfig:
 *                 type: object
 *                 properties:
 *                   nodeCount:
 *                     type: number
 *                   quizFrequency:
 *                     type: number
 *     responses:
 *       200:
 *         description: Generated roadmap nodes
 */
router.post(
  '/generate-roadmap',
  authenticate,
  authorize('instructor'),
  [body('title').notEmpty().withMessage('Course title is required')],
  validate,
  generateCourseRoadmap
);

/**
 * @swagger
 * /api/ai/evaluate-answer:
 *   post:
 *     summary: Evaluate an open-ended quiz answer (Student only)
 *     description: >
 *       Calls the external AI service to evaluate a free-text answer.
 *       Currently returns mock evaluation. See AI_SERVICE_CONTRACT.md for full spec.
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               aiPromptContext:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI evaluation result
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
 *                     isCorrect:
 *                       type: boolean
 *                     score:
 *                       type: number
 *                     feedback:
 *                       type: string
 */
router.post(
  '/evaluate-answer',
  authenticate,
  authorize('student'),
  [
    body('question').notEmpty().withMessage('Question is required'),
    body('answer').notEmpty().withMessage('Answer is required'),
  ],
  validate,
  evaluateOpenAnswer
);

export default router;
