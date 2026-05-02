import request from 'supertest';
import app from '../../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import Course from '../models/Course.js';

describe('Courses API', () => {
    let studentToken, instructorToken;

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
        const student = await generateTestUser('student');
        studentToken = student.token;
        
        const instructor = await generateTestUser('instructor');
        instructorToken = instructor.token;
    });

    describe('GET /api/courses', () => {
        it('should return empty list initially', async () => {
            const res = await request(app)
                .get('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.courses).toEqual([]);
        });

        it('should return courses in the database', async () => {
            // Seed a course
            await Course.create({
                title: 'Test Course',
                department: 'CS',
                status: 'published'
            });

            const res = await request(app)
                .get('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.courses.length).toBe(1);
            expect(res.body.courses[0].title).toBe('Test Course');
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
                .field('department', 'Math')
                .field('description', 'A test course');
                // For files, we could mock .attach('files', Buffer.from('test'), 'test.pdf') 
                // but keeping it simple for basic metadata testing
            
            expect(res.status).toBe(201);
            expect(res.body.course.title).toBe('New Course');
        });

        it('should forbid students from creating courses', async () => {
            const res = await request(app)
                .post('/api/courses')
                .set('Authorization', `Bearer ${studentToken}`)
                .field('title', 'Hacked Course');
            
            expect(res.status).toBe(403);
        });
    });
});
