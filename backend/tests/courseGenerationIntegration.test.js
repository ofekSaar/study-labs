import { jest } from '@jest/globals';

// Setup Mocks using ESM Jest unstable_mockModule before any imports
const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));
const mockIO = { to: mockTo };

jest.unstable_mockModule('../config/socket.js', () => {
  return {
    initSocket: () => mockIO,
    getIO: () => mockIO
  };
});

let mockEvaluationScore = 85;
const mockGenerateRoadmap = jest.fn(async (params) => {
  return {
    nodes: [
      {
        title: 'Lesson 1: Introduction: Topic 1.1: Basics',
        type: 'quiz',
        order: 0,
        estimatedMinutes: 45,
        xpReward: 200,
        lessonContent: '# Lesson 1 Summary Content',
        quizData: [
          {
            type: 'mcq',
            question: 'What is DFA?',
            options: ['A', 'B'],
            correctAnswerIndex: 0,
            explanation: 'Explanation',
            alignmentWarning: false
          }
        ],
        isMaterialGrounded: params.isUpdate ? true : false
      }
    ],
    courseStructure: {
      "Lesson 1: Introduction": {
        "Topic 1.1: Basics": {
          "summary_id": "summary-123",
          "quiz_id": "quiz-123",
          "is_material_grounded": params.isUpdate ? true : false
        }
      }
    }
  };
});

const mockEvaluateCourse = jest.fn(async (params) => {
  if (mockEvaluationScore < 50 && !params.isUpdate) {
    // Quality check throws for creation if score < 50
    throw new Error(`AI Judge quality check failed. Score: ${mockEvaluationScore}/100. Feedback: Mocked failure`);
  }
  return {
    score: mockEvaluationScore,
    feedback: "Mocked quality check",
    criteria_breakdown: {}
  };
});

jest.unstable_mockModule('../services/aiService.js', () => {
  return {
    generateRoadmap: (params) => mockGenerateRoadmap(params),
    evaluateCourse: (params) => mockEvaluateCourse(params),
    recoverStuckGenerations: async () => {},
    evaluateAnswer: async () => ({ isCorrect: true, score: 90, feedback: "Excellent" })
  };
});

// Dynamically import everything else now that mocks are registered
const { default: request } = await import('supertest');
const { default: app } = await import('../server.js');
const { connectTestDB, closeTestDB, clearTestDB } = await import('./utils/testSetup.js');
const { generateTestUser } = await import('./utils/authHelper.js');
const { default: Course } = await import('../models/Course.js');
const { default: CourseNode } = await import('../models/CourseNode.js');
const { default: storage } = await import('../services/storage/index.js');
const { deduplicateAndUpload } = await import('../services/fileUploadService.js');

describe('Course Generation & Update Integration Tests', () => {
  let instructor, instructorToken;

  beforeAll(async () => {
    // Set node env to integration-test so courseGenerationService doesn't bypass real generation
    process.env.NODE_ENV = 'integration-test';
    process.env.JWT_SECRET = 'test_secret';
    await connectTestDB();
    
    // Mock storage uploads
    jest.spyOn(storage, 'upload').mockResolvedValue({
      filename: 'test_file.pdf',
      storagePath: 'uploads/test_file.pdf'
    });
    
    // Mock storage content uploads
    jest.spyOn(storage, 'uploadContent').mockResolvedValue('uploads/summary-123.md');
    
    // Mock storage mutes/deletes
    jest.spyOn(storage, 'delete').mockResolvedValue(true);
  });

  afterAll(async () => {
    await closeTestDB();
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    await clearTestDB();
    mockEmit.mockClear();
    mockTo.mockClear();
    mockGenerateRoadmap.mockClear();
    mockEvaluateCourse.mockClear();
    mockEvaluationScore = 85;

    const setup = await generateTestUser('instructor');
    instructor = setup.user;
    instructorToken = setup.token;
  });

  describe('Step 1, 2 & 3: Course Creation & Deduplication', () => {
    it('should create a course in <200ms and run the generation pipeline in background', async () => {
      const startTime = Date.now();
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${instructorToken}`)
        .field('title', 'Computational Models')
        .field('department', 'cs')
        .field('description', 'A course on formal models and automata theory.')
        .attach('syllabus', Buffer.from('%PDF-1.5 test syllabus'), 'Syllabus.pdf');
      
      const duration = Date.now() - startTime;
      
      // Step 1: Verify immediate API response
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.course.generationStatus).toBe('generating');
      expect(duration).toBeLessThan(200); // Verify non-blocking execution

      // Wait a moment for background task to complete mock-processing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 8: Verify database creation, node creation, storage upload, and socket emission
      const course = await Course.findOne({ title: 'Computational Models' });
      expect(course.generationStatus).toBe('ready');
      expect(course.isPublished).toBe(true);

      const nodes = await CourseNode.find({ course: course._id });
      expect(nodes.length).toBe(1);
      expect(nodes[0].title).toBe('Lesson 1: Introduction: Topic 1.1: Basics');
      expect(nodes[0].xpReward).toBe(200);
      expect(nodes[0].isMaterialGrounded).toBe(false); // starts as false in mock for creation

      // Verify Socket.io emission
      expect(mockTo).toHaveBeenCalledWith(`course_${course._id}`);
      expect(mockEmit).toHaveBeenCalledWith('course_generation_status', expect.objectContaining({
        status: 'ready'
      }));
    });

    it('should deduplicate files based on name and size in backend', async () => {
      const files = [
        { originalname: 'slide.pptx', size: 500, filename: 'slide1' },
        { originalname: 'slide.pptx', size: 500, filename: 'slide2' }, // duplicate
        { originalname: 'notes.pdf', size: 200, filename: 'notes' }
      ];
      
      const result = await deduplicateAndUpload(files);
      // Step 2: Verification of deduplication
      expect(result.length).toBe(2);
      expect(result[0].originalName).toBe('slide.pptx');
      expect(result[1].originalName).toBe('notes.pdf');
    });
  });

  describe('Step 13, 17 & 18: Course Updates', () => {
    let existingCourse;

    beforeEach(async () => {
      existingCourse = await Course.create({
        title: 'Models Course',
        department: 'cs',
        description: 'Existing course structure.',
        instructor: instructor._id,
        generationStatus: 'ready',
        isPublished: true,
        syllabus: {
          filename: 'Syllabus.pdf',
          originalName: 'Syllabus.pdf',
          mimetype: 'application/pdf',
          storagePath: 'uploads/Syllabus.pdf',
          size: 100
        },
        materials: []
      });
    });

    it('should trigger update pipeline with isUpdate=true and update nodes in-place preserving _id', async () => {
      const existingNode = await CourseNode.create({
        course: existingCourse._id,
        title: 'Lesson 1: Introduction: Topic 1.1: Basics',
        type: 'quiz',
        order: 0,
        lessonContentPath: 'uploads/old-summary.md',
        lessonContent: '# Old content',
        isMaterialGrounded: false
      });

      const res = await request(app)
        .post(`/api/courses/${existingCourse._id}/materials`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .attach('materials', Buffer.from('new slide content'), 'presentation.pptx');

      expect(res.status).toBe(200);

      // Wait a moment for background updates to run
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 13: Verify update parameters passed to AI Service
      expect(mockGenerateRoadmap).toHaveBeenCalled();
      const paramsPassed = mockGenerateRoadmap.mock.calls[0][0];
      expect(paramsPassed.isUpdate).toBe(true);

      // Step 17: Verify in-place update (Node _id is preserved)
      const nodes = await CourseNode.find({ course: existingCourse._id });
      expect(nodes.length).toBe(1);
      expect(nodes[0]._id.toString()).toBe(existingNode._id.toString());
      expect(nodes[0].isMaterialGrounded).toBe(true); // updated to true in mock during update

      // Verify that old storage file cleanup was executed
      expect(storage.delete).toHaveBeenCalledWith('uploads/old-summary.md');
    });

    it('should not block or throw errors on updates if AI Judge score is below 50', async () => {
      // Step 18: Verify update is non-blocking on low judge score
      mockEvaluationScore = 40; // low score

      await request(app)
        .post(`/api/courses/${existingCourse._id}/materials`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .attach('materials', Buffer.from('new slide content'), 'presentation.pptx');

      await new Promise(resolve => setTimeout(resolve, 300));

      const updated = await Course.findById(existingCourse._id);
      // Status should still recover to 'ready' because low score check is skipped on update
      expect(updated.generationStatus).toBe('ready');
      expect(updated.isPublished).toBe(true);
    });
  });
});
