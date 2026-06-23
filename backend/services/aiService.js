/**
 * AI Service Client.
 *
 * Interacts with the local FastAPI AI Engine container.
 */
import path from 'path';
import Course from '../models/Course.js';

import { STUCK_GENERATION_THRESHOLD_MS } from '../constants/config.js';

/**
 * Startup recovery — marks courses that are stuck in 'generating' as 'failed'
 * so instructors can retry them.
 *
 * A course is considered stuck when its generationStartedAt is older than
 * STUCK_GENERATION_THRESHOLD_MS.  Courses without a generationStartedAt
 * (created before this field was introduced) are recovered after the same
 * threshold relative to their updatedAt timestamp.
 *
 * USAGE: call this once after the database connection is established.
 * Add the following two lines to backend/server.js inside startServer(),
 * immediately after `await connectDB()`:
 *
 *   import { recoverStuckGenerations } from './services/aiService.js';
 *   await recoverStuckGenerations();
 */
export const recoverStuckGenerations = async () => {
  const cutoff = new Date(Date.now() - STUCK_GENERATION_THRESHOLD_MS);

  const result = await Course.updateMany(
    {
      generationStatus: 'generating',
      // Recover courses that were explicitly stamped and are past the deadline,
      // OR legacy courses (no stamp) whose updatedAt indicates they were generating
      // before the threshold.
      $or: [
        { generationStartedAt: { $lt: cutoff } },
        { generationStartedAt: null, updatedAt: { $lt: cutoff } },
      ],
    },
    {
      $set: {
        generationStatus: 'failed',
        generationError: 'Generation interrupted (server restart) — please retry.',
        isPublished: false,
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`[AI Service] Recovered ${result.modifiedCount} stuck course(s) — marked as failed.`);
  } else {
    console.log('[AI Service] No stuck courses found on startup.');
  }
};

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-engine:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

/**
 * Generates a course roadmap (nodes) from uploaded materials.
 * 
 * @param {object} params
 * @param {string} params.courseId - Course ID
 * @param {string} params.title - Course title
 * @param {string} params.description - Course description
 * @param {string} params.syllabus - Storage path for the syllabus
 * @param {Array} params.materials - Array of storage paths for materials
 * @param {object} params.aiConfig - AI configuration (nodeCount, quizFrequency)
 * @returns {Promise<Array>} - Generated course nodes
 */
export const generateRoadmap = async ({
  courseId,
  title,
  description,
  syllabus,
  materials,
  aiConfig,
  analyzeImages = false,
  isUpdate = false,
  newMaterials = [],
}) => {
  if (!syllabus) {
    throw new Error('Syllabus is required for course generation.');
  }

  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const syllabusPath = path.resolve(uploadDir, syllabus);
  const materialsPaths = materials && materials.length > 0 
    ? materials.map(m => path.resolve(uploadDir, m)) 
    : [];
  const newMaterialsPaths = newMaterials && newMaterials.length > 0
    ? newMaterials.map(m => path.resolve(uploadDir, m))
    : [];

  console.log(`[AI Service] Sending course generation request for Course ID: ${courseId} (isUpdate: ${isUpdate})`);
  console.log(`[AI Service] Syllabus: ${syllabusPath}`);
  console.log(`[AI Service] Materials: ${materialsPaths.length} files attached.`);
  console.log(`[AI Service] New Materials: ${newMaterialsPaths.length} files attached.`);
  console.log(`[AI Service] Image Analysis: ${analyzeImages ? 'ENABLED' : 'DISABLED'}`);

  // We use the native http module here instead of fetch() to bypass the strict 
  // 5-minute (300s) idle timeout built into Node 18+ fetch implementation.
  // The AI pipeline can take up to 10 minutes for large courses.
  const http = await import('http');
  const url = new URL(`${AI_SERVICE_URL}/api/generate-course/`);
  
  const postData = JSON.stringify({ 
    courseId, 
    syllabusPath, 
    materialsPaths,
    analyzeImages,
    isUpdate,
    newMaterialsPaths
  });

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 1200000 // 20 minutes upper limit
  };

  const data = await new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse AI response: ${e.message}`));
          }
        } else {
          reject(new Error(`AI Service Error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`AI Request Failed: ${e.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI Request Timed Out after 20 minutes'));
    });

    req.write(postData);
    req.end();
  });

  console.log(`[AI Service] Course successfully generated with ID: ${data.course_id}`);
  
  // Transform the response (course_structure) into the flat nodes array expected by the rest of the backend
  const nodes = [];
  let orderIndex = 0;

  for (const [lessonTitle, lessonData] of Object.entries(data.course_structure)) {
      for (const [topicTitle, topicData] of Object.entries(lessonData)) {
          let quizData = undefined;
          let summaryContent = null;

          // Fetch quiz data — use quiz_id if available, else parse from quiz_route
          const quizId = topicData.quiz_id || (topicData.quiz_route ? topicData.quiz_route.split('/quizzes/')[1]?.replace('/', '') : null);
          if (quizId) {
              try {
                  const qRes = await fetch(`${AI_SERVICE_URL}/api/quizzes/${quizId}/`, {
                      headers: { 'Authorization': `Bearer ${AI_SERVICE_API_KEY}` }
                  });
                  if (qRes.ok) {
                      const qData = await qRes.json();
                      // Map AI engine question format → CourseNode quizData schema
                      quizData = (qData.questions || []).map(q => ({
                          type: 'mcq',
                          question: q.question_text || q.question,
                          options: q.options || [],
                          correctAnswerIndex: typeof q.correct_answer === 'number' ? q.correct_answer : 0,
                          explanation: q.explanation || null,
                          alignmentWarning: q.alignment_warning === true,
                      }));
                  }
              } catch (err) {
                  console.error(`[AI Service] Failed to fetch quiz ${quizId}:`, err.message);
              }
          }

          // Fetch summary data — use summary_id if available, else parse from summary_route
          const summaryId = topicData.summary_id || (topicData.summary_route ? topicData.summary_route.split('/summaries/')[1]?.replace('/', '') : null);
          if (summaryId) {
              try {
                  const sRes = await fetch(`${AI_SERVICE_URL}/api/summaries/${summaryId}/`, {
                      headers: { 'Authorization': `Bearer ${AI_SERVICE_API_KEY}` }
                  });
                  if (sRes.ok) {
                      const sData = await sRes.json();
                      summaryContent = sData.content;
                  }
              } catch (err) {
                  console.error(`[AI Service] Failed to fetch summary ${summaryId}:`, err.message);
              }
          }

          nodes.push({
              title: `${lessonTitle}: ${topicTitle}`,
              type: 'quiz',
              order: orderIndex++,
              estimatedMinutes: 45,
              xpReward: 200,
              lessonContent: summaryContent || topicData.description || '', 
              quizData: quizData && quizData.length > 0 ? quizData : undefined,
              isMaterialGrounded: topicData.is_material_grounded !== false,
          });
      }
  }

  console.log(`[AI Service] Transformed ${nodes.length} nodes (${nodes.filter(n => n.quizData).length} with quizzes, ${nodes.filter(n => n.lessonContent).length} with summaries)`);
  return { nodes, courseStructure: data.course_structure };
};

/**
 * Evaluates an open-ended quiz answer using AI.
 * 
 * @param {object} params
 * @param {string} params.question - The question text
 * @param {string} params.answer - Student's answer
 * @param {string} params.aiPromptContext - Context for AI evaluation
 * @returns {Promise<object>} - Evaluation result { isCorrect, score, feedback }
 */
export const evaluateAnswer = async ({ question, answer, aiPromptContext }) => {
  const response = await fetch(`${AI_SERVICE_URL}/api/evaluate-answer/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
    },
    body: JSON.stringify({ question, answer, aiPromptContext }),
  });

  if (!response.ok) {
     const errText = await response.text();
     throw new Error(`AI Service Error: ${errText}`);
  }

  return response.json();
};

/**
 * Evaluates the generated course against its syllabus using AI.
 * 
 * @param {object} params
 * @param {string} params.courseId - Course ID
 * @param {string} params.syllabus - Storage path for the syllabus
 * @param {object} params.courseStructure - The raw course structure returned by the AI
 * @returns {Promise<object>} - Evaluation result { score, feedback, criteria_breakdown }
 */
export const evaluateCourse = async ({ courseId, syllabus, courseStructure }) => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const syllabusPath = path.resolve(uploadDir, syllabus);

  console.log(`[AI Service] Evaluating course quality for Course ID: ${courseId}`);

  // Using native http module to avoid timeout issues for potentially long evaluation
  const http = await import('http');
  const url = new URL(`${AI_SERVICE_URL}/api/evaluate-course/`);
  
  const postData = JSON.stringify({ 
    courseId, 
    syllabusPath, 
    courseStructure
  });

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 600000 // 10 minutes upper limit for evaluation
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse AI evaluation response: ${e.message}`));
          }
        } else {
          reject(new Error(`AI Service Evaluation Error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(new Error(`AI Evaluation Request Failed: ${e.message}`)));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI Evaluation Request Timed Out'));
    });

    req.write(postData);
    req.end();
  });
};

