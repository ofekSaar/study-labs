import request from 'supertest';
import app from '../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

const TEST_SYLLABUS = {
    filename: 'syllabus.pdf',
    originalName: 'syllabus.pdf',
    mimetype: 'application/pdf',
    storagePath: 'uploads/syllabus.pdf',
    size: 1024,
};

describe('Enrollments API', () => {
    let student, instructor, studentToken, instructorToken, course;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test_secret';
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();

        const s = await generateTestUser('student');
        student = s.user;
        studentToken = s.token;

        const i = await generateTestUser('instructor');
        instructor = i.user;
        instructorToken = i.token;

        course = await Course.create({
            title: 'Test Course',
            department: 'cs',
            description: 'This is a test description that meets all required constraints.',
            instructor: instructor._id,
            syllabus: TEST_SYLLABUS,
            isPublished: true
        });
    });

    describe('POST /api/enrollments', () => {
        it('should allow student to request enrollment', async () => {
            const res = await request(app)
                .post('/api/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: course._id });

            expect(res.status).toBe(201);
            expect(res.body.data.enrollment.status).toBe('pending');
            expect(res.body.data.enrollment.student._id).toBe(student._id.toString());
        });

        it('should prevent duplicate requests', async () => {
            await Enrollment.create({
                student: student._id,
                course: course._id,
                status: 'pending'
            });

            const res = await request(app)
                .post('/api/enrollments')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ courseId: course._id });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/already pending|already requested/i);
        });
    });

    describe('PUT /api/enrollments/:id/approve', () => {
        let enrollment;

        beforeEach(async () => {
            enrollment = await Enrollment.create({
                student: student._id,
                course: course._id,
                status: 'pending'
            });
        });

        it('should allow instructor to approve enrollment', async () => {
            const res = await request(app)
                .put(`/api/enrollments/${enrollment._id}/approve`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ status: 'approved' });

            expect(res.status).toBe(200);
            expect(res.body.data.enrollment.status).toBe('approved');
        });

        it('should forbid students from changing status', async () => {
            const res = await request(app)
                .put(`/api/enrollments/${enrollment._id}/approve`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ status: 'approved' });

            expect(res.status).toBe(403);
        });

        it('should prevent approving an already-approved enrollment', async () => {
            enrollment.status = 'approved';
            await enrollment.save();

            const res = await request(app)
                .put(`/api/enrollments/${enrollment._id}/approve`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ status: 'approved' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/approved/i);
        });
    });

    describe('PUT /api/enrollments/:id/deny', () => {
        let enrollment;

        beforeEach(async () => {
            enrollment = await Enrollment.create({
                student: student._id,
                course: course._id,
                status: 'pending',
            });
        });

        it('should allow instructor to deny a pending enrollment', async () => {
            const res = await request(app)
                .put(`/api/enrollments/${enrollment._id}/deny`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.enrollment.status).toBe('denied');
        });

        it('should return 400 when denying a non-pending enrollment', async () => {
            enrollment.status = 'approved';
            await enrollment.save();

            const res = await request(app)
                .put(`/api/enrollments/${enrollment._id}/deny`)
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(res.status).toBe(400);
        });

        it('should return 403 when a student tries to deny', async () => {
            const res = await request(app)
                .put(`/api/enrollments/${enrollment._id}/deny`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/enrollments/pending-all', () => {
        it('should return pending enrollments for instructor courses only', async () => {
            await Enrollment.create({ student: student._id, course: course._id, status: 'pending' });

            const res = await request(app)
                .get('/api/enrollments/pending-all')
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.enrollments.length).toBeGreaterThanOrEqual(1);
            res.body.data.enrollments.forEach(e => {
                expect(e.status).toBe('pending');
            });
        });

        it('should return empty array when no pending enrollments exist', async () => {
            const res = await request(app)
                .get('/api/enrollments/pending-all')
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.enrollments).toEqual([]);
        });

        it('should return 403 for students', async () => {
            const res = await request(app)
                .get('/api/enrollments/pending-all')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/enrollments/my', () => {
        it('should return student own enrollments', async () => {
            await Enrollment.create({ student: student._id, course: course._id, status: 'approved' });

            const res = await request(app)
                .get('/api/enrollments/my')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.enrollments.length).toBeGreaterThanOrEqual(1);
            const enr = res.body.data.enrollments[0];
            expect(String(enr.student?._id ?? enr.student)).toBe(String(student._id));
        });

        it('should return empty array when student has no enrollments', async () => {
            const res = await request(app)
                .get('/api/enrollments/my')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.enrollments).toEqual([]);
        });

        it('should return 403 for instructors', async () => {
            const res = await request(app)
                .get('/api/enrollments/my')
                .set('Authorization', `Bearer ${instructorToken}`);

            expect(res.status).toBe(403);
        });
    });
});
