import createError from 'http-errors';
import CourseNode from '../models/CourseNode.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Enrollment from '../models/Enrollment.js';
import { evaluateAnswer } from '../services/aiService.js';

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
    const XP_PER_MCQ = 100;
    const XP_PER_OPEN = 150;

    for (const answer of answers) {
      const question = node.quizData[answer.questionIndex];
      if (!question) continue;

      // Skip summary questions
      if (question.type === 'summary') continue;

      if (question.type === 'mcq') {
        const isCorrect = answer.selectedOption === question.correctAnswerIndex;
        scoredAnswers.push({
          questionIndex: answer.questionIndex,
          selectedOption: answer.selectedOption,
          isCorrect,
        });
        if (isCorrect) totalScore += XP_PER_MCQ;
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
        if (evaluation.isCorrect) totalScore += XP_PER_OPEN;
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
