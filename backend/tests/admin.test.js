import request from 'supertest';
import app from '../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser, generateTestAdmin } from './utils/authHelper.js';
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

describe('Admin API', () => {
    let admin, adminToken, student, studentToken, instructor, instructorToken;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test_secret';
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        const adminSetup = await generateTestAdmin();
        admin = adminSetup.user;
        adminToken = adminSetup.token;

        const studentSetup = await generateTestUser('student');
        student = studentSetup.user;
        studentToken = studentSetup.token;

        const instructorSetup = await generateTestUser('instructor');
        instructor = instructorSetup.user;
        instructorToken = instructorSetup.token;
    });

    describe('Authentication guard', () => {
        it('should return 401 without token', async () => {
            const res = await request(app).get('/api/admin/stats');
            expect(res.status).toBe(401);
        });

        it('should return 403 for non-admin user', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/admin/stats', () => {
        it('should return platform overview counts', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toMatchObject({
                totalUsers: expect.any(Number),
                totalCourses: expect.any(Number),
                pendingEnrollments: expect.any(Number),
                totalXpAwarded: expect.any(Number),
            });
        });

        it('should reflect actual user counts', async () => {
            const res = await request(app)
                .get('/api/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            // admin + student + instructor = 3
            expect(res.body.data.totalUsers).toBe(3);
        });
    });

    describe('GET /api/admin/users', () => {
        it('should return paginated user list', async () => {
            const res = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.users).toHaveLength(3);
            expect(res.body.data.total).toBe(3);
            expect(res.body.data.page).toBe(1);
        });

        it('should filter users by search query', async () => {
            const res = await request(app)
                .get('/api/admin/users?search=Test Admin')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data.users[0].name).toBe('Test Admin');
        });

        it('should respect limit param', async () => {
            const res = await request(app)
                .get('/api/admin/users?limit=1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.users).toHaveLength(1);
            expect(res.body.data.pages).toBe(3);
        });
    });

    describe('PUT /api/admin/users/:id/role', () => {
        it('should update a user role', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${student._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ roles: ['instructor'] });

            expect(res.status).toBe(200);
            expect(res.body.data.user.roles).toContain('instructor');

            const dbUser = await User.findById(student._id);
            expect(dbUser.roles).toContain('instructor');
        });

        it('should return 400 for invalid role', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${student._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ roles: ['superadmin'] });

            expect(res.status).toBe(400);
        });

        it('should prevent removing own admin role', async () => {
            const res = await request(app)
                .put(`/api/admin/users/${admin._id}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ roles: ['student'] });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/cannot remove your own admin/i);
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = '000000000000000000000001';
            const res = await request(app)
                .put(`/api/admin/users/${fakeId}/role`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ roles: ['student'] });

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/admin/users/:id', () => {
        it('should delete a user and cascade their data', async () => {
            // Create a course and progress/enrollment for the student
            const tempCourse = await Course.create({
                title: 'Temp Course',
                department: 'cs',
                description: 'Temp course for cascade delete test.',
                instructor: instructor._id,
                generationStatus: 'ready',
                isPublished: true,
                syllabus: TEST_SYLLABUS,
            });
            await Progress.create({ student: student._id, course: tempCourse._id });
            await Enrollment.create({ student: student._id, course: tempCourse._id, status: 'approved' });

            const res = await request(app)
                .delete(`/api/admin/users/${student._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(await User.findById(student._id)).toBeNull();
            expect(await Progress.findOne({ student: student._id })).toBeNull();
            expect(await Enrollment.findOne({ student: student._id })).toBeNull();
        });

        it('should prevent admin from deleting their own account', async () => {
            const res = await request(app)
                .delete(`/api/admin/users/${admin._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/cannot delete your own/i);
        });

        it('should return 404 for non-existent user', async () => {
            const fakeId = '000000000000000000000001';
            const res = await request(app)
                .delete(`/api/admin/users/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/admin/courses', () => {
        let course;

        beforeEach(async () => {
            course = await Course.create({
                title: 'Admin Test Course',
                department: 'cs',
                description: 'A test course for admin tests with enough description.',
                instructor: instructor._id,
                generationStatus: 'ready',
                isPublished: true,
                syllabus: TEST_SYLLABUS,
            });
        });

        it('should return all courses with enrollment counts', async () => {
            const res = await request(app)
                .get('/api/admin/courses')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.courses).toHaveLength(1);
            expect(res.body.data.courses[0]).toHaveProperty('enrolledCount');
            expect(res.body.data.courses[0].title).toBe('Admin Test Course');
        });

        it('should filter courses by search query', async () => {
            const res = await request(app)
                .get('/api/admin/courses?search=Admin Test')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.courses.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('PUT /api/admin/courses/:id/publish', () => {
        it('should toggle isPublished', async () => {
            const course = await Course.create({
                title: 'Toggle Course',
                department: 'cs',
                description: 'Toggle test course with a description that is long enough.',
                instructor: instructor._id,
                generationStatus: 'ready',
                isPublished: true,
                syllabus: TEST_SYLLABUS,
            });

            const res = await request(app)
                .put(`/api/admin/courses/${course._id}/publish`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.isPublished).toBe(false);

            const dbCourse = await Course.findById(course._id);
            expect(dbCourse.isPublished).toBe(false);
        });

        it('should return 404 for non-existent course', async () => {
            const fakeId = '000000000000000000000001';
            const res = await request(app)
                .put(`/api/admin/courses/${fakeId}/publish`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/admin/courses/:id', () => {
        it('should delete course and cascade nodes/enrollments/progress', async () => {
            const course = await Course.create({
                title: 'Delete Course',
                department: 'cs',
                description: 'Course to be deleted with enough description.',
                instructor: instructor._id,
                generationStatus: 'ready',
                isPublished: true,
                syllabus: TEST_SYLLABUS,
            });
            await CourseNode.create({ course: course._id, title: 'Node 1', order: 1, type: 'lesson' });
            await Enrollment.create({ student: student._id, course: course._id, status: 'approved' });

            const res = await request(app)
                .delete(`/api/admin/courses/${course._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(await Course.findById(course._id)).toBeNull();
            expect(await CourseNode.findOne({ course: course._id })).toBeNull();
            expect(await Enrollment.findOne({ course: course._id })).toBeNull();
        });

        it('should return 404 for non-existent course', async () => {
            const fakeId = '000000000000000000000001';
            const res = await request(app)
                .delete(`/api/admin/courses/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/admin/shop/prices', () => {
        it('should return default shop prices when no config exists', async () => {
            const res = await request(app)
                .get('/api/admin/shop/prices')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('prices');
            expect(typeof res.body.data.prices).toBe('object');
        });
    });

    describe('PUT /api/admin/shop/prices', () => {
        it('should upsert shop prices', async () => {
            const newPrices = { avatar_cool: 500, title_pro: 300 };

            const res = await request(app)
                .put('/api/admin/shop/prices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ prices: newPrices });

            expect(res.status).toBe(200);
            expect(res.body.data.prices).toMatchObject(newPrices);
        });

        it('should return 400 when prices is missing', async () => {
            const res = await request(app)
                .put('/api/admin/shop/prices')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/admin/instructors', () => {
        it('should return instructors with aggregated stats', async () => {
            const res = await request(app)
                .get('/api/admin/instructors')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.instructors.length).toBeGreaterThanOrEqual(1);
            const inst = res.body.data.instructors.find(u => String(u._id) === String(instructor._id));
            expect(inst).toBeDefined();
            expect(inst.stats).toMatchObject({
                totalCourses: expect.any(Number),
                totalStudents: expect.any(Number),
            });
        });

        it('should filter instructors by search', async () => {
            const res = await request(app)
                .get('/api/admin/instructors?search=Test User')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.instructors.length).toBeGreaterThanOrEqual(1);
        });
    });
});
