import request from 'supertest';
import app from '../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import Course from '../models/Course.js';
import CourseNode from '../models/CourseNode.js';
import Enrollment from '../models/Enrollment.js';
import Progress from '../models/Progress.js';

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

        it('should embed progress for enrolled courses and null for others', async () => {
            const courseData = (title) => ({
                title,
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
            const enrolledCourse = await Course.create(courseData('Enrolled Course'));
            const otherCourse = await Course.create(courseData('Other Course'));

            await Enrollment.create({
                student: student._id,
                course: enrolledCourse._id,
                status: 'approved'
            });

            const nodes = await CourseNode.create(
                [1, 2, 3, 4].map((order) => ({
                    course: enrolledCourse._id,
                    title: `Node ${order}`,
                    type: 'lesson',
                    order
                }))
            );

            await Progress.create({
                student: student._id,
                course: enrolledCourse._id,
                completedNodes: [nodes[0]._id],
                totalXP: 150
            });

            const res = await request(app)
                .get('/api/courses?view=student')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            const byTitle = Object.fromEntries(
                res.body.data.courses.map((c) => [c.title, c])
            );
            expect(byTitle['Enrolled Course'].enrollmentStatus).toBe('approved');
            expect(byTitle['Enrolled Course'].progress).toEqual({
                percentComplete: 25,
                totalXP: 150
            });
            expect(byTitle['Other Course'].progress).toBeNull();
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

    describe('POST /api/courses/:id/materials', () => {
        let course;

        beforeEach(async () => {
            course = await Course.create({
                title: 'Existing Course',
                department: 'cs',
                description: 'Existing course description that is sufficiently long.',
                instructor: instructor._id,
                syllabus: {
                    filename: 'syllabus.pdf',
                    originalName: 'syllabus.pdf',
                    mimetype: 'application/pdf',
                    storagePath: 'uploads/syllabus.pdf',
                    size: 100
                },
                materials: [],
                isPublished: true,
                generationStatus: 'ready'
            });
        });

        it('should allow instructors to add materials to their course', async () => {
            const res = await request(app)
                .post(`/api/courses/${course._id}/materials`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .attach('materials', Buffer.from('dummy slide content'), 'slides1.pdf');

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.course.materials.length).toBe(1);
            expect(res.body.data.course.materials[0].originalName).toBe('slides1.pdf');

            const updated = await Course.findById(course._id);
            expect(updated.generationStatus).toBe('generating');
        });

        it('should forbid students from adding materials', async () => {
            const res = await request(app)
                .post(`/api/courses/${course._id}/materials`)
                .set('Authorization', `Bearer ${studentToken}`)
                .attach('materials', Buffer.from('dummy slide content'), 'slides1.pdf');

            expect(res.status).toBe(403);
        });

        it('should return 404 for a non-existent course', async () => {
            const res = await request(app)
                .post('/api/courses/60c72b2f9b1d8e25d88db9a9/materials')
                .set('Authorization', `Bearer ${instructorToken}`)
                .attach('materials', Buffer.from('dummy slide content'), 'slides1.pdf');

            expect(res.status).toBe(404);
        });
    });

    describe('GET & PUT /api/courses/:id/nodes/:nodeId/content', () => {
        let course, node;

        beforeEach(async () => {
            course = await Course.create({
                title: 'Lesson Summary Test Course',
                department: 'cs',
                description: 'Course description for testing lesson content APIs.',
                instructor: instructor._id,
                syllabus: {
                    filename: 'syllabus.pdf',
                    originalName: 'syllabus.pdf',
                    mimetype: 'application/pdf',
                    storagePath: 'uploads/syllabus.pdf',
                    size: 100
                },
                materials: [],
                isPublished: true,
                generationStatus: 'ready'
            });

            node = await CourseNode.create({
                course: course._id,
                title: 'Introduction to DFAs',
                type: 'lesson',
                order: 1,
                sequenceOrder: 1,
                lessonContent: '# DFAs\nDeterministic Finite Automata overview.',
                isMaterialGrounded: true,
                qualityWarning: true
            });
        });

        it('should return lesson summary content for a node', async () => {
            const res = await request(app)
                .get(`/api/courses/${course._id}/nodes/${node._id}/content`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.nodeId.toString()).toBe(node._id.toString());
            expect(res.body.data.title).toBe('Introduction to DFAs');
            expect(res.body.data.content).toContain('Deterministic Finite Automata');
            expect(res.body.data.isMaterialGrounded).toBe(true);
            expect(res.body.data.qualityWarning).toBe(true);
        });

        it('should allow course instructor to update lesson summary content', async () => {
            const newContent = '# DFAs Updated\nUpdated summary text by instructor.';
            const res = await request(app)
                .put(`/api/courses/${course._id}/nodes/${node._id}/content`)
                .set('Authorization', `Bearer ${instructorToken}`)
                .send({ content: newContent });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.content).toBe(newContent);

            const updatedNode = await CourseNode.findById(node._id);
            expect(updatedNode.lessonContent).toBe(newContent);
        });

        it('should forbid non-owner instructors from editing lesson summary', async () => {
            const otherInstructorSetup = await generateTestUser('instructor');
            const newContent = 'Hacked summary';

            const res = await request(app)
                .put(`/api/courses/${course._id}/nodes/${node._id}/content`)
                .set('Authorization', `Bearer ${otherInstructorSetup.token}`)
                .send({ content: newContent });

            expect(res.status).toBe(403);
        });

        it('should forbid students from editing lesson summary', async () => {
            const res = await request(app)
                .put(`/api/courses/${course._id}/nodes/${node._id}/content`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ content: 'Student hack attempt' });

            expect(res.status).toBe(403);
        });
    });
});
