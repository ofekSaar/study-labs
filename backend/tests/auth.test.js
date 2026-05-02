import request from 'supertest';
import app from '../../server.js';
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
            expect(res.body.user.email).toBe(user.email);
            expect(res.body.user.role).toBe('student');
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
            // Create user without role
            const { user, token } = await generateTestUser(null);
            
            const res = await request(app)
                .put('/api/auth/role')
                .set('Authorization', `Bearer ${token}`)
                .send({ role: 'instructor' });
            
            expect(res.status).toBe(200);
            expect(res.body.user.role).toBe('instructor');
            
            // Verify in DB
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
    });
});
