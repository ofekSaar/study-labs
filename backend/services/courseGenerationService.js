import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import { generateRoadmap, evaluateCourse } from './aiService.js';
import storage from './storage/index.js';
import { getIO } from '../config/socket.js';

/**
 * Emits a course generation status event to all sockets in the course room.
 *
 * @param {string} courseId
 * @param {'ready'|'failed'} status
 * @param {string} [error]
 */
const emitGenerationStatus = (courseId, status, error) => {
  try {
    const io = getIO();
    if (io) {
      io.to(`course_${courseId}`).emit('course_generation_status', {
        status,
        courseId: courseId.toString(),
        ...(error ? { error } : {}),
      });
    }
  } catch (socketErr) {
    console.error('[Background] Failed to emit generation status socket:', socketErr.message);
  }
};

/**
 * Runs the AI roadmap generation in the background (fire-and-forget).
 * Updates the course document when the pipeline succeeds or fails.
 *
 * @param {object} course - Mongoose Course document
 * @param {object} syllabusData
 * @param {Array}  materialsData
 * @param {string} title
 * @param {string} description
 * @param {boolean} [analyzeImages=false]
 */
export const generateRoadmapInBackground = async (
  course,
  syllabusData,
  materialsData,
  title,
  description,
  analyzeImages = false
) => {
  if (process.env.NODE_ENV === 'test') {
    try {
      const exists = await Course.exists({ _id: course._id });
      if (exists) {
        const nodes = [
          { course: course._id, title: 'Lesson 1', type: 'lesson', order: 0, estimatedMinutes: 45, xpReward: 150 },
          { course: course._id, title: 'Quiz 1',   type: 'quiz',   order: 1, estimatedMinutes: 45, xpReward: 150 },
        ];
        await CourseNode.insertMany(nodes);
        await Course.findByIdAndUpdate(course._id, {
          isPublished: true,
          generationStatus: 'ready',
          generationError: null,
        });
      }
    } catch (err) {
      console.error('[Test Mode] Mock course generation failed:', err.message);
    }
    return;
  }

  try {
    console.log(`[Background] Starting AI generation for course ${course._id} (attempt ${course.generationAttempts})...`);

    await Course.findByIdAndUpdate(course._id, {
      generationStartedAt: new Date(),
      generationAttempts: course.generationAttempts,
    });

    const roadmapResult = await generateRoadmap({
      courseId: course._id.toString(),
      title,
      description,
      syllabus: syllabusData.storagePath,
      materials: materialsData.map((m) => m.storagePath),
      aiConfig: course.aiConfig,
      analyzeImages,
    });

    if (!roadmapResult.nodes || roadmapResult.nodes.length === 0) {
      throw new Error('AI failed to generate any lessons. The syllabus might be empty or too complex.');
    }

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

    course.aiEvaluation = { status: 'evaluating' };
    await course.save();

    console.log(`[Background] Starting AI Judge evaluation for course ${course._id}...`);
    try {
      const evaluationResult = await evaluateCourse({
        courseId: course._id.toString(),
        syllabus: syllabusData.storagePath,
        courseStructure: roadmapResult.courseStructure,
      });

      course.aiEvaluation = {
        status: 'completed',
        score: evaluationResult.score,
        feedback: evaluationResult.feedback,
        criteriaBreakdown: evaluationResult.criteria_breakdown,
        evaluatedAt: new Date(),
      };
      console.log(`[Background] AI Judge evaluation complete. Score: ${evaluationResult.score}`);

      if (evaluationResult.score < 50) {
        throw new Error(
          `Course generation failed quality check. AI Judge Score: ${evaluationResult.score}. Feedback: ${evaluationResult.feedback}`
        );
      }
    } catch (evalError) {
      console.error('[Background] Evaluation failed:', evalError.message);
      course.aiEvaluation.status = 'failed';
      if (evalError.message.includes('failed quality check')) throw evalError;
      console.warn('[Background] Proceeding to publish despite evaluation API failure.');
    }

    course.isPublished = true;
    course.generationStatus = 'ready';
    course.generationError = null;
    await course.save();

    console.log(`[Background] ✅ Course ${course._id} generation complete! ${roadmapResult.nodes?.length || 0} nodes created.`);
    emitGenerationStatus(course._id, 'ready');
  } catch (error) {
    console.error(`[Background] ❌ Course ${course._id} generation failed:`, error.message);
    try {
      await Course.findByIdAndUpdate(course._id, {
        generationStatus: 'failed',
        generationError: error.message,
        isPublished: false,
      });
      emitGenerationStatus(course._id, 'failed', error.message);
    } catch (persistError) {
      console.error(
        `[Background] ❌ Failed to record generation failure for course ${course._id}:`,
        persistError.message
      );
    }
  }
};
