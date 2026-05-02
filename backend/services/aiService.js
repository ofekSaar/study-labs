/**
 * AI Service Client.
 * 
 * Interacts with the local FastAPI AI Engine container.
 */
import path from 'path';

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
}) => {
  if (!syllabus) {
    throw new Error('Syllabus is required for course generation.');
  }

  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const syllabusPath = path.resolve(uploadDir, syllabus);
  const materialsPaths = materials && materials.length > 0 
    ? materials.map(m => path.resolve(uploadDir, m)) 
    : [];

  console.log(`[AI Service] Sending course generation request for Course ID: ${courseId}`);
  console.log(`[AI Service] Syllabus: ${syllabusPath}`);
  console.log(`[AI Service] Materials: ${materialsPaths.length} files attached.`);

  const response = await fetch(`${AI_SERVICE_URL}/api/generate-course/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
    },
    body: JSON.stringify({ 
      courseId, 
      syllabusPath, 
      materialsPaths 
    }),
  });

  if (!response.ok) {
     const errText = await response.text();
     console.error(`[AI Service] Error response: ${errText}`);
     throw new Error(`AI Service Error: ${errText}`);
  }

  const data = await response.json();
  console.log(`[AI Service] Course successfully generated with ID: ${data.course_id}`);
  
  // Transform the response (course_structure) into the flat nodes array expected by the rest of the backend
  const nodes = [];
  let orderIndex = 0;

  for (const [lessonTitle, lessonData] of Object.entries(data.course_structure)) {
      // Create a lesson node (Optional: depends on how the frontend renders lessons vs topics)
      for (const [topicTitle, topicData] of Object.entries(lessonData)) {
          const isQuiz = !!topicData.quiz_id || !!topicData.quiz_route;
          
          nodes.push({
              title: `${lessonTitle}: ${topicTitle}`,
              type: isQuiz ? 'quiz' : 'lesson',
              order: orderIndex++,
              estimatedMinutes: isQuiz ? 20 : 45,
              xpReward: isQuiz ? 200 : 150,
              // The real AI engine stores the content in MongoDB and returns routes
              // The frontend expects lessonContent directly or we fetch it later
              // For now, we will just pass the routes to the frontend or fetch them here
              lessonContent: topicData.description, 
              aiSummaryRoute: topicData.summary_route,
              aiQuizRoute: topicData.quiz_route
          });
      }
  }

  return { nodes };
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

