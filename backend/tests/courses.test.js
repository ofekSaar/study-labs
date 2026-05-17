import request from 'supertest';
import app from '../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import Course from '../models/Course.js';

describe('Courses API', () => {
    let student, instructor, studentToken, instructorToken;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test_secret';
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
        
        // Setup users
        const studentSetup = await generateTestUser('student');
        student = studentSetup.user;
        studentToken = studentSetup.token;
        
        const instructorSetup = await generateTestUser('instructor');
        instructor = instructorSetup.user;
        instructorToken = instructorSetup.token;
    });

    describe('GET /api/courses', () => {
        it('should return empty list initially', async () => {
            const res = await request(app)
                .get('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.data.courses).toEqual([]);
        });

        it('should return courses in the database', async () => {
            // Seed a course
            await Course.create({
                title: 'Test Course',
                department: 'cs',
                description: 'This is a test description of the course that is sufficiently long.',
                instructor: instructor._id,
                syllabus: {
                    filename: 'syllabus-123.pdf',
                    originalName: 'syllabus.pdf',
                    mimetype: 'application/pdf',
                    storagePath: 'uploads/syllabus-123.pdf',
                    size: 1024
                },
                isPublished: true
            });

            const res = await request(app)
                .get('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.data.courses.length).toBe(1);
            expect(res.body.data.courses[0].title).toBe('Test Course');
        });

        it('should reject unauthenticated requests', async () => {
            const res = await request(app).get('/api/courses');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/courses', () => {
        it('should allow instructors to create courses', async () => {
            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${instructorToken}`)
                .field('title', 'New Course')
                .field('department', 'math')
                .field('description', 'A test course description that is sufficiently long enough.')
                .attach('syllabus', Buffer.from('dummy pdf content'), 'syllabus.pdf');
            
            expect(res.status).toBe(201);
            expect(res.body.data.course.title).toBe('New Course');
        });

        it('should forbid students from creating courses', async () => {
            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .field('title', 'Hacked Course')
                .field('department', 'cs')
                .field('description', 'Hacked description.');
            
            expect(res.status).toBe(403);
        });
    });
});
