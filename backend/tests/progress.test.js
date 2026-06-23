import request from 'supertest';
import app from '../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';
import XpEvent from '../models/XpEvent.js';

const TEST_SYLLABUS = {
    filename: 'syllabus.pdf',
    originalName: 'syllabus.pdf',
    mimetype: 'application/pdf',
    storagePath: 'uploads/syllabus.pdf',
    size: 1024,
};

describe('Progress API', () => {
    let student, studentToken, instructor, instructorToken;
    let course, node;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test_secret';
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        const studentSetup = await generateTestUser('student');
        student = studentSetup.user;
        studentToken = studentSetup.token;

        const instructorSetup = await generateTestUser('instructor');
        instructor = instructorSetup.user;
        instructorToken = instructorSetup.token;

        course = await Course.create({
            title: 'Progress Test Course',
            department: 'cs',
            description: 'Course for progress and leaderboard tests with a long enough description.',
            instructor: instructor._id,
            generationStatus: 'ready',
            isPublished: true,
            syllabus: TEST_SYLLABUS,
        });

        node = await CourseNode.create({
            course: course._id,
            title: 'Node 1',
            type: 'lesson',
            order: 0,
            estimatedMinutes: 30,
            xpReward: 100,
        });
    });

    describe('GET /api/progress/leaderboard', () => {
        it('should return empty leaderboard when no progress exists', async () => {
            const res = await request(app)
                .get('/api/progress/leaderboard')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.leaderboard).toEqual([]);
        });

        it('should return all-time leaderboard with ranked entries', async () => {
            // Seed progress for the student
            await Progress.create({
                student: student._id,
                course: course._id,
                totalXP: 300,
            });

            const res = await request(app)
                .get('/api/progress/leaderboard')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.leaderboard.length).toBeGreaterThanOrEqual(1);
            const entry = res.body.leaderboard[0];
            expect(entry).toMatchObject({ rank: 1, xp: 300, isYou: true });
            expect(entry).toHaveProperty('name');
            expect(entry).toHaveProperty('level');
        });

        it('should return weekly leaderboard using XpEvents', async () => {
            await XpEvent.create({
                student: student._id,
                course: course._id,
                xpAwarded: 150,
                baseXp: 150,
                source: 'lesson',
                createdAt: new Date(),
            });

            const res = await request(app)
                .get('/api/progress/leaderboard?period=weekly')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.leaderboard.length).toBeGreaterThanOrEqual(1);
            expect(res.body.leaderboard[0].xp).toBe(150);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/progress/leaderboard');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/progress/course/:courseId/leaderboard', () => {
        it('should return empty leaderboard when no approved enrollments exist', async () => {
            const res = await request(app)
                .get(`/api/progress/course/${course._id}/leaderboard`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.leaderboard).toEqual([]);
        });

        it('should return ranked students for a course', async () => {
            await Enrollment.create({
                student: student._id,
                course: course._id,
                status: 'approved',
            });
            await Progress.create({
                student: student._id,
                course: course._id,
                totalXP: 200,
            });

            const res = await request(app)
                .get(`/api/progress/course/${course._id}/leaderboard`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.leaderboard.length).toBeGreaterThanOrEqual(1);
            expect(res.body.leaderboard[0]).toMatchObject({ rank: 1, xp: 200 });
        });
    });

    describe('GET /api/progress/gamification/purchase-history', () => {
        it('should return empty array by default', async () => {
            const res = await request(app)
                .get('/api/progress/gamification/purchase-history')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.purchaseHistory).toEqual([]);
        });

        it('should return items in reverse chronological order after a purchase', async () => {
            // Seed a purchase directly in DB
            await User.findByIdAndUpdate(student._id, {
                $push: {
                    purchaseHistory: [
                        { category: 'avatar', itemId: 'avatar_1', cost: 100, purchasedAt: new Date('2025-01-01') },
                        { category: 'title', itemId: 'title_1', cost: 200, purchasedAt: new Date('2025-02-01') },
                    ],
                },
            });

            const res = await request(app)
                .get('/api/progress/gamification/purchase-history')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            const history = res.body.data.purchaseHistory;
            expect(history).toHaveLength(2);
            // Most recent should be first (reversed)
            expect(new Date(history[0].purchasedAt) > new Date(history[1].purchasedAt)).toBe(true);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/progress/gamification/purchase-history');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/progress/complete-node', () => {
        it('should return 401 without token', async () => {
            const res = await request(app)
                .post('/api/progress/complete-node')
                .send({ courseId: String(course._id), nodeId: String(node._id) });

            expect(res.status).toBe(401);
        });

        it('should return 400 when courseId is missing', async () => {
            await Enrollment.create({ student: student._id, course: course._id, status: 'approved' });

            const res = await request(app)
                .post('/api/progress/complete-node')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ nodeId: String(node._id) });

            expect(res.status).toBe(400);
        });

        it('should return 400 when nodeId is missing', async () => {
            await Enrollment.create({ student: student._id, course: course._id, status: 'approved' });

            const res = await request(app)
                .post('/api/progress/complete-node')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: String(course._id) });

            expect(res.status).toBe(400);
        });

        it('should return 403 when student is not enrolled', async () => {
            const res = await request(app)
                .post('/api/progress/complete-node')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: String(course._id), nodeId: String(node._id) });

            expect(res.status).toBe(403);
        });

        it('should return success with XP grant for enrolled student', async () => {
            await Enrollment.create({ student: student._id, course: course._id, status: 'approved' });

            const res = await request(app)
                .post('/api/progress/complete-node')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: String(course._id), nodeId: String(node._id) });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('xpAwarded');
            expect(res.body.data.xpAwarded).toBeGreaterThan(0);
        });

        it('should allow instructor to complete a node in their own course (no XP granted)', async () => {
            const res = await request(app)
                .post('/api/progress/complete-node')
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ courseId: String(course._id), nodeId: String(node._id) });

            expect(res.status).toBe(200);
            expect(res.body.data.isInstructor).toBe(true);
        });
    });
});
