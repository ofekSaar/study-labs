import createError from 'http-errors';
import CourseNode from '../models/CourseNode.js';
import Course from '../models/Course.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Enrollment from '../models/Enrollment.js';
import { evaluateAnswer } from '../services/aiService.js';
import { XP_BY_QUESTION_TYPE } from '../constants/config.js';

/**
 * Get quiz questions for a specific node.
 */
export const getQuizQuestions = async (req, res, next) => {
  try {
    const node = await CourseNode.findById(req.params.nodeId);
    if (!node) throw createError(404, 'Node not found');

    if (!node.quizData || node.quizData.length === 0) {
      throw createError(400, 'This node does not have quiz data');
    }

    // Verify enrollment if student
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: node.course,
        status: 'approved',
      });
      if (!enrollment) throw createError(403, 'You are not enrolled in this course');
    }

    // Return questions without correct answers for MCQs
    const questions = node.quizData.map((q, index) => {
      const question = {
        index,
        type: q.type,
        question: q.question,
      };

      if (q.type === 'mcq') {
        question.options = q.options;
        question.correctAnswerIndex = q.correctAnswerIndex;
        question.explanation = q.explanation;
      }
      if (q.type === 'summary') {
        question.content = q.content;
      }
      if (q.type === 'open') {
        question.minLength = q.minLength;
      }

      return question;
    });

    res.json({
      status: 'success',
      data: {
        nodeId: node._id,
        nodeTitle: node.title,
        courseId: node.course,
        questions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify the requesting instructor owns the course that contains this node.
 */
const verifyInstructorOwnership = async (nodeId, userId) => {
  const node = await CourseNode.findById(nodeId);
  if (!node) throw createError(404, 'Node not found');
  if (!node.quizData || node.quizData.length === 0) {
    throw createError(400, 'This node does not have quiz data');
  }
  const course = await Course.findById(node.course);
  if (!course) throw createError(404, 'Course not found');
  if (String(course.instructor) !== String(userId)) {
    throw createError(403, 'You do not own this course');
  }
  return node;
};

/**
 * Update a single quiz question (instructor only).
 * PUT /api/quizzes/node/:nodeId/question/:questionIndex
 */
export const updateQuestion = async (req, res, next) => {
  try {
    const { nodeId, questionIndex } = req.params;
    const idx = parseInt(questionIndex, 10);
    const node = await verifyInstructorOwnership(nodeId, req.user._id);

    if (isNaN(idx) || idx < 0 || idx >= node.quizData.length) {
      throw createError(400, 'Invalid question index');
    }

    const { question, options, correctAnswerIndex, explanation, type, content, minLength, alignmentWarning } = req.body;

    const existing = node.quizData[idx].toObject();
    node.quizData[idx] = {
      ...existing,
      ...(question !== undefined && { question }),
      ...(options !== undefined && { options }),
      ...(correctAnswerIndex !== undefined && { correctAnswerIndex }),
      ...(explanation !== undefined && { explanation }),
      ...(type !== undefined && { type }),
      ...(content !== undefined && { content }),
      ...(minLength !== undefined && { minLength }),
      ...(alignmentWarning !== undefined && { alignmentWarning }),
      editCount: (existing.editCount || 0) + 1,
    };

    await node.save();

    res.json({
      status: 'success',
      data: { question: node.quizData[idx] },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a single quiz question (instructor only).
 * DELETE /api/quizzes/node/:nodeId/question/:questionIndex
 */
export const deleteQuestion = async (req, res, next) => {
  try {
    const { nodeId, questionIndex } = req.params;
    const idx = parseInt(questionIndex, 10);
    const node = await verifyInstructorOwnership(nodeId, req.user._id);

    if (isNaN(idx) || idx < 0 || idx >= node.quizData.length) {
      throw createError(400, 'Invalid question index');
    }

    node.quizData.splice(idx, 1);
    await node.save();

    res.json({ status: 'success', data: { deletedIndex: idx, remaining: node.quizData.length } });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit quiz attempt and get scoring.
 */
export const submitQuiz = async (req, res, next) => {
  try {
    const { nodeId, answers } = req.body;

    const node = await CourseNode.findById(nodeId);
    if (!node) throw createError(404, 'Node not found');
    if (!node.quizData || node.quizData.length === 0) {
      throw createError(400, 'This node does not have quiz data');
    }

    // Verify enrollment if student
    if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: node.course,
        status: 'approved',
      });
      if (!enrollment) throw createError(403, 'You are not enrolled in this course');
    }

    // Score each answer
    const scoredAnswers = [];
    let totalScore = 0;

    for (const answer of answers) {
      const question = node.quizData[answer.questionIndex];
      if (!question) continue;

      // Skip summary questions and unknown types
      if (question.type === 'summary') continue;
      const xpForType = XP_BY_QUESTION_TYPE[question.type];
      if (xpForType === undefined) continue;

      if (question.type === 'mcq') {
        const isCorrect = answer.selectedOption === question.correctAnswerIndex;
        scoredAnswers.push({
          questionIndex: answer.questionIndex,
          selectedOption: answer.selectedOption,
          isCorrect,
        });
        if (isCorrect) totalScore += xpForType;
      }

      if (question.type === 'open') {
        const evaluation = await evaluateAnswer({
          question: question.question,
          answer: answer.openAnswer,
          aiPromptContext: question.aiPromptContext,
        });

        scoredAnswers.push({
          questionIndex: answer.questionIndex,
          openAnswer: answer.openAnswer,
          isCorrect: evaluation.isCorrect,
        });
        if (evaluation.isCorrect) totalScore += xpForType;
      }
    }

    // Save attempt
    const attempt = await QuizAttempt.create({
      student: req.user._id,
      courseNode: nodeId,
      answers: scoredAnswers,
      score: totalScore,
      xpEarned: totalScore,
    });

    // Return results with explanations
    const results = scoredAnswers.map((sa) => {
      const question = node.quizData[sa.questionIndex];
      return {
        ...sa,
        explanation: question?.explanation || null,
        correctAnswerIndex: question?.type === 'mcq' ? question.correctAnswerIndex : undefined,
      };
    });

    res.json({
      status: 'success',
      data: {
        attemptId: attempt._id,
        score: totalScore,
        xpEarned: totalScore,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};
