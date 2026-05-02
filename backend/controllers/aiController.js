import createError from 'http-errors';
import { generateRoadmap, evaluateAnswer } from '../services/aiService.js';

/**
 * Generate a course roadmap using AI.
 * Proxies to the external AI service.
 */
export const generateCourseRoadmap = async (req, res, next) => {
  try {
    const { courseId, title, description, materials, aiConfig } = req.body;

    if (!title) throw createError(400, 'Course title is required');

    const result = await generateRoadmap({
      courseId,
      title,
      description,
      materials,
      aiConfig,
    });

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Evaluate an open-ended answer using AI.
 * Proxies to the external AI service.
 */
export const evaluateOpenAnswer = async (req, res, next) => {
  try {
    const { question, answer, aiPromptContext } = req.body;

    if (!question || !answer) {
      throw createError(400, 'Question and answer are required');
    }

    const result = await evaluateAnswer({ question, answer, aiPromptContext });

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
