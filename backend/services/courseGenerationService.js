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
  analyzeImages = false,
  isUpdate = false,
  newMaterialsData = []
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
    console.log(`[Background] Starting AI generation for course ${course._id} (attempt ${course.generationAttempts}, isUpdate: ${isUpdate})...`);

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
      isUpdate,
      newMaterials: newMaterialsData.map((m) => m.storagePath),
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
      isMaterialGrounded: Boolean(node.isMaterialGrounded),
    }));

    if (isUpdate) {
      console.log(`[Background] Performing in-place update for course ${course._id} nodes...`);
      for (const nodeData of nodes) {
        const existingNode = await CourseNode.findOne({ course: course._id, title: nodeData.title });
        if (existingNode) {
          if (nodeData.lessonContent) {
            if (existingNode.lessonContentPath) {
              try {
                await storage.delete(existingNode.lessonContentPath);
              } catch (err) {
                console.warn(`[Background] Failed to delete old lesson content: ${err.message}`);
              }
            }
            const mdResult = await storage.uploadContent(
              nodeData.lessonContent,
              `${nodeData.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`,
              `lessons/${course._id}`
            );
            existingNode.lessonContentPath = mdResult.storagePath;
            existingNode.lessonContent = nodeData.lessonContent;
          }
          if (nodeData.quizData) {
            existingNode.quizData = nodeData.quizData;
          }
          existingNode.isMaterialGrounded = nodeData.isMaterialGrounded;
          await existingNode.save();
        } else {
          // Fallback if node doesn't exist
          if (nodeData.lessonContent) {
            const mdResult = await storage.uploadContent(
              nodeData.lessonContent,
              `${nodeData.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`,
              `lessons/${course._id}`
            );
            nodeData.lessonContentPath = mdResult.storagePath;
          }
          await CourseNode.create(nodeData);
        }
      }
    } else {
      console.log(`[Background] Creating new nodes for course ${course._id}...`);
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
    }

    course.aiEvaluation = { status: 'evaluating' };
    await course.save();

    console.log(`[Background] Starting AI Judge evaluation for course ${course._id} (isUpdate: ${isUpdate})...`);
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

      if (evaluationResult.score < 50 && !isUpdate) {
        throw new Error(
          `Course generation failed quality check. AI Judge Score: ${evaluationResult.score}. Feedback: ${evaluationResult.feedback}`
        );
      }
    } catch (evalError) {
      console.error('[Background] Evaluation failed:', evalError.message);
      course.aiEvaluation.status = 'failed';
      if (evalError.message.includes('failed quality check') && !isUpdate) throw evalError;
      console.warn('[Background] Proceeding despite evaluation API failure.');
    }

    course.isPublished = true;
    course.generationStatus = 'ready';
    course.generationError = null;
    course.generationCompletedAt = new Date();
    await course.save();

    console.log(`[Background] ✅ Course ${course._id} generation complete! ${roadmapResult.nodes?.length || 0} nodes processed.`);
    emitGenerationStatus(course._id, 'ready');
    try {
      const { getIO } = await import('../config/socket.js');
      const io = getIO();
      const instructorId = course.instructor?.toString() || course.instructor;
      
      if (isUpdate) {
        io.to(`user_${instructorId}`).emit('instructor_notification', {
          type: 'material_update_complete',
          message: `Materials update for "${course.title}" is complete.`,
          courseId: course._id.toString(),
          courseTitle: course.title,
          createdAt: new Date(),
        });
      } else {
        const scoreMsg = course.aiEvaluation?.score ? ` AI Score: ${course.aiEvaluation.score}/100.` : '';
        io.to(`user_${instructorId}`).emit('instructor_notification', {
          type: 'generation_complete',
          message: `Course "${course.title}" is ready!${scoreMsg}`,
          courseId: course._id.toString(),
          courseTitle: course.title,
          createdAt: new Date(),
        });
      }
      
      // Low quality warning
      if (course.aiEvaluation?.score && course.aiEvaluation.score < 70) {
        io.to(`user_${instructorId}`).emit('instructor_notification', {
          type: 'low_quality_warning',
          message: `Course "${course.title}" scored ${course.aiEvaluation.score}/100. Consider reviewing materials.`,
          courseId: course._id.toString(),
          courseTitle: course.title,
          createdAt: new Date(),
        });
      }
    } catch (notifErr) {
      console.warn('[Background] Failed to send instructor notification:', notifErr.message);
    }
  } catch (error) {
    console.error(`[Background] ❌ Course ${course._id} generation failed:`, error.message);
    try {
      await Course.findByIdAndUpdate(course._id, {
        generationStatus: 'failed',
        generationError: error.message,
        isPublished: false,
        generationCompletedAt: new Date(),
      });
      emitGenerationStatus(course._id, 'failed', error.message);
      try {
        const { getIO } = await import('../config/socket.js');
        const io = getIO();
        const instructorId = course.instructor?.toString() || course.instructor;
        io.to(`user_${instructorId}`).emit('instructor_notification', {
          type: 'generation_failed',
          message: `Course "${course.title}" generation failed: ${error.message}`,
          courseId: course._id.toString(),
          courseTitle: course.title,
          createdAt: new Date(),
        });
      } catch (notifErr) {
        console.warn('[Background] Failed to send failure notification:', notifErr.message);
      }
    } catch (persistError) {
      console.error(
        `[Background] ❌ Failed to record generation failure for course ${course._id}:`,
        persistError.message
      );
    }
  }
};
