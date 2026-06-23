import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import { recoverStuckGenerations } from '../services/aiService.js';
import { STUCK_GENERATION_THRESHOLD_MS } from '../constants/config.js';

const TEST_SYLLABUS = {
    filename: 'syllabus.pdf',
    originalName: 'syllabus.pdf',
    mimetype: 'application/pdf',
    storagePath: 'uploads/syllabus.pdf',
    size: 1024,
};

describe('AI Service', () => {
    let instructor, instructorToken;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test_secret';
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        const setup = await generateTestUser('instructor');
        instructor = setup.user;
        instructorToken = setup.token;
    });

    describe('recoverStuckGenerations()', () => {
        it('should mark old stuck courses as failed', async () => {
            const stuckDate = new Date(Date.now() - STUCK_GENERATION_THRESHOLD_MS - 60_000);

            const course = await Course.create({
                title: 'Stuck Course',
                department: 'cs',
                description: 'A course stuck in generating with enough description.',
                instructor: instructor._id,
                generationStatus: 'generating',
                generationStartedAt: stuckDate,
                syllabus: TEST_SYLLABUS,
            });

            await recoverStuckGenerations();

            const updated = await Course.findById(course._id);
            expect(updated.generationStatus).toBe('failed');
            expect(updated.generationError).toMatch(/interrupted/i);
            expect(updated.isPublished).toBe(false);
        });

        it('should not touch recently started courses', async () => {
            const recentDate = new Date(Date.now() - 60_000); // 1 minute ago

            const course = await Course.create({
                title: 'Recent Course',
                department: 'cs',
                description: 'A recently started course with enough description.',
                instructor: instructor._id,
                generationStatus: 'generating',
                generationStartedAt: recentDate,
                syllabus: TEST_SYLLABUS,
            });

            await recoverStuckGenerations();

            const unchanged = await Course.findById(course._id);
            expect(unchanged.generationStatus).toBe('generating');
        });

        it('should not touch courses already marked ready or failed', async () => {
            const course = await Course.create({
                title: 'Ready Course',
                department: 'cs',
                description: 'A ready course that should not be touched by recovery.',
                instructor: instructor._id,
                generationStatus: 'ready',
                isPublished: true,
                syllabus: TEST_SYLLABUS,
            });

            await recoverStuckGenerations();

            const unchanged = await Course.findById(course._id);
            expect(unchanged.generationStatus).toBe('ready');
        });

        it('should recover legacy courses without generationStartedAt using updatedAt', async () => {
            const oldDate = new Date(Date.now() - STUCK_GENERATION_THRESHOLD_MS - 60_000);

            const course = await Course.create({
                title: 'Legacy Stuck Course',
                department: 'cs',
                description: 'A legacy stuck course without generationStartedAt.',
                instructor: instructor._id,
                generationStatus: 'generating',
                syllabus: TEST_SYLLABUS,
            });
            // Bypass Mongoose timestamps to force updatedAt into the past
            await Course.collection.updateOne({ _id: course._id }, { $set: { updatedAt: oldDate } });

            await recoverStuckGenerations();

            const updated = await Course.findById(course._id);
            expect(updated.generationStatus).toBe('failed');
        });
    });

    describe('POST /api/ai/evaluate-answer (mocked AI service)', () => {
        let studentToken;

        beforeEach(async () => {
            const studentSetup = await generateTestUser('student');
            studentToken = studentSetup.token;

            // Mock global fetch for AI service calls
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ isCorrect: true, score: 85, feedback: 'Good answer!' }),
            });
        });

        afterEach(() => {
            delete global.fetch;
        });

        it('should return evaluation result', async () => {
            const res = await request(app)
                .post('/api/ai/evaluate-answer')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    question: 'What is polymorphism?',
                    answer: 'Polymorphism allows objects of different types to be treated as a common type.',
                });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toMatchObject({ isCorrect: true, score: 85 });
        });

        it('should return 400 when question or answer is missing', async () => {
            const res = await request(app)
                .post('/api/ai/evaluate-answer')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ question: 'What is X?' }); // missing answer

            expect(res.status).toBe(400);
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .post('/api/ai/evaluate-answer')
                .send({ question: 'Test?', answer: 'Test.' });

            expect(res.status).toBe(401);
        });
    });

    describe('generateRoadmapInBackground() — test mode stub', () => {
        it('should create 2 stub nodes and mark course as ready', async () => {
            const course = await Course.create({
                title: 'Test Gen Course',
                department: 'cs',
                description: 'Course for testing the test-mode stub generation.',
                instructor: instructor._id,
                generationStatus: 'generating',
                syllabus: TEST_SYLLABUS,
            });

            const { generateRoadmapInBackground } = await import('../services/courseGenerationService.js');
            const syllabusData = { storagePath: 'uploads/syllabus.pdf' };
            await generateRoadmapInBackground(course, syllabusData, [], course.title, course.description);

            const updated = await Course.findById(course._id);
            expect(updated.generationStatus).toBe('ready');
            expect(updated.isPublished).toBe(true);

            const nodes = await CourseNode.find({ course: course._id });
            expect(nodes).toHaveLength(2);
        });
    });
});
