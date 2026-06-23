import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { getQuizQuestions, submitQuiz, updateQuestion, deleteQuestion } from '../controllers/quizController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Quizzes
 *   description: Quiz endpoints
 */

/**
 * @swagger
 * /api/quizzes/node/{nodeId}:
 *   get:
 *     summary: Get quiz questions for a node
 *     tags: [Quizzes]
 *     parameters:
 *       - in: path
 *         name: nodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz questions (without correct answers)
 *       400:
 *         description: Node has no quiz data
 *       403:
 *         description: Not enrolled
 *       404:
 *         description: Node not found
 */
router.get('/node/:nodeId', authenticate, authorize('student', 'instructor'), getQuizQuestions);

/**
 * @swagger
 * /api/quizzes/submit:
 *   post:
 *     summary: Submit a quiz attempt
 *     tags: [Quizzes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nodeId
 *               - answers
 *             properties:
 *               nodeId:
 *                 type: string
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionIndex:
 *                       type: number
 *                     selectedOption:
 *                       type: number
 *                       description: For MCQ questions
 *                     openAnswer:
 *                       type: string
 *                       description: For open-ended questions
 *     responses:
 *       200:
 *         description: Quiz scored with results
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
 *                     attemptId:
 *                       type: string
 *                     score:
 *                       type: number
 *                     xpEarned:
 *                       type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 */
/**
 * @swagger
 * /api/quizzes/node/{nodeId}/question/{questionIndex}:
 *   put:
 *     summary: Update a quiz question (instructor only)
 *     tags: [Quizzes]
 *   delete:
 *     summary: Delete a quiz question (instructor only)
 *     tags: [Quizzes]
 */
router.put('/node/:nodeId/question/:questionIndex', authenticate, authorize('instructor'), updateQuestion);
router.delete('/node/:nodeId/question/:questionIndex', authenticate, authorize('instructor'), deleteQuestion);

router.post(
  '/submit',
  authenticate,
  authorize('student', 'instructor'),
  [
    body('nodeId').notEmpty().withMessage('Node ID is required'),
    body('answers').isArray().withMessage('Answers must be an array'),
  ],
  validate,
  submitQuiz
);

export default router;
