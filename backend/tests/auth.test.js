import request from 'supertest';
import app from '../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import User from '../models/User.js';

describe('Auth API', () => {
    beforeAll(async () => {
        process.env.JWT_SECRET = 'test_secret';
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    beforeEach(async () => {
        await clearTestDB();
    });

    describe('GET /api/auth/me', () => {
        it('should return user profile for valid token', async () => {
            const { user, token } = await generateTestUser('student');

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.user.email).toBe(user.email);
            expect(res.body.data.user.role).toBe('student');
        });

        it('should return 401 if no token provided', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
        });

        it('should return 401 if token is invalid', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid_token_here');
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/auth/role', () => {
        it('should allow user to set their role if unset', async () => {
            const { user, token } = await generateTestUser(null);

            const res = await request(app)
                .put('/api/auth/role')
                .set('Authorization', `Bearer ${token}`)
                .send({ role: 'instructor' });

            expect(res.status).toBe(200);
            expect(res.body.data.user.role).toBe('instructor');

            const dbUser = await User.findById(user._id);
            expect(dbUser.role).toBe('instructor');
        });

        it('should prevent changing role if already set', async () => {
            const { token } = await generateTestUser('student');

            const res = await request(app)
                .put('/api/auth/role')
                .set('Authorization', `Bearer ${token}`)
                .send({ role: 'instructor' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/role already set/i);
        });

        it('should return 400 when roles is null', async () => {
            const { token } = await generateTestUser(null);

            const res = await request(app)
                .put('/api/auth/role')
                .set('Authorization', `Bearer ${token}`)
                .send({ roles: null });

            expect(res.status).toBe(400);
        });

        it('should return 400 when roles is an empty array', async () => {
            const { token } = await generateTestUser(null);

            const res = await request(app)
                .put('/api/auth/role')
                .set('Authorization', `Bearer ${token}`)
                .send({ roles: [] });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/at least one role/i);
        });

        it('should return 400 for an invalid role value', async () => {
            const { token } = await generateTestUser(null);

            const res = await request(app)
                .put('/api/auth/role')
                .set('Authorization', `Bearer ${token}`)
                .send({ role: 'admin' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/invalid role/i);
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should return 200 with success message', async () => {
            const { token } = await generateTestUser('student');

            const res = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toMatch(/logged out/i);
        });

        it('should return 401 without token', async () => {
            const res = await request(app).post('/api/auth/logout');
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/auth/profile', () => {
        it('should update name and avatar', async () => {
            const { user, token } = await generateTestUser('student');

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'New Name', avatar: 'http://example.com/new.png' });

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user.name).toBe('New Name');
            expect(res.body.data.user.avatar).toBe('http://example.com/new.png');

            const dbUser = await User.findById(user._id);
            expect(dbUser.name).toBe('New Name');
        });

        it('should update only name when avatar is omitted', async () => {
            const { token } = await generateTestUser('student');

            const res = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: 'Only Name' });

            expect(res.status).toBe(200);
            expect(res.body.data.user.name).toBe('Only Name');
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .put('/api/auth/profile')
                .send({ name: 'Hacker' });
            expect(res.status).toBe(401);
        });
    });
});
