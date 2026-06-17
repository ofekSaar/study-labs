import request from 'supertest';
import app from '../server.js';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser } from './utils/authHelper.js';
import User from '../models/User.js';

describe('Gamification API', () => {
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

    describe('GET /api/progress/gamification', () => {
        it('should return initial gamification state', async () => {
            const { user, token } = await generateTestUser('student');

            const res = await request(app)
                .get('/api/progress/gamification')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body.data.coins).toBe(100);
            expect(res.body.data.activeAvatar).toBe('default');
            expect(res.body.data.unlockedAvatars).toContain('default');
        });
    });

    describe('PUT /api/progress/gamification/sync', () => {
        it('should sync stats and coins to database', async () => {
            const { user, token } = await generateTestUser('student');

            const syncData = {
                coins: 450,
                streakShields: 2,
                stats: {
                    lessons_completed: 12,
                    total_xp: 1200,
                    level: 5
                },
                questsClaimed: ['quest_1', 'quest_2']
            };

            const res = await request(app)
                .put('/api/progress/gamification/sync')
                .set('Authorization', `Bearer ${token}`)
                .send(syncData);

            expect(res.status).toBe(200);
            expect(res.body.data.coins).toBe(450);
            expect(res.body.data.streakShields).toBe(2);
            expect(res.body.data.stats.lessons_completed).toBe(12);
            expect(res.body.data.stats.total_xp).toBe(1200);
            expect(res.body.data.stats.level).toBe(5);
            expect(res.body.data.questsClaimed).toContain('quest_1');
            expect(res.body.data.questsClaimed).toContain('quest_2');

            // Verify in database
            const dbUser = await User.findById(user._id);
            expect(dbUser.coins).toBe(450);
            expect(dbUser.stats.lessons_completed).toBe(12);
        });
    });

    describe('POST /api/progress/gamification/shop/buy', () => {
        it('should allow purchase of valid shop items if user has enough coins', async () => {
            const { user, token } = await generateTestUser('student');

            // Setup user with 300 coins
            await User.findByIdAndUpdate(user._id, { coins: 300 });

            const res = await request(app)
                .post('/api/progress/gamification/shop/buy')
                .set('Authorization', `Bearer ${token}`)
                .send({ category: 'avatars', itemId: 'wizard_scholar' }); // cost: 150

            expect(res.status).toBe(200);
            expect(res.body.data.coins).toBe(150); // 300 - 150 = 150
            expect(res.body.data.unlockedAvatars).toContain('wizard_scholar');

            // Verify in database
            const dbUser = await User.findById(user._id);
            expect(dbUser.coins).toBe(150);
            expect(dbUser.unlockedAvatars).toContain('wizard_scholar');
        });

        it('should deny purchase if user has insufficient coins', async () => {
            const { user, token } = await generateTestUser('student');

            // Setup user with 50 coins (wizard_scholar costs 150)
            await User.findByIdAndUpdate(user._id, { coins: 50 });

            const res = await request(app)
                .post('/api/progress/gamification/shop/buy')
                .set('Authorization', `Bearer ${token}`)
                .send({ category: 'avatars', itemId: 'wizard_scholar' });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/insufficient coins/i);
        });

        it('should return 400 for invalid categories or items', async () => {
            const { token } = await generateTestUser('student');

            const res = await request(app)
                .post('/api/progress/gamification/shop/buy')
                .set('Authorization', `Bearer ${token}`)
                .send({ category: 'invalid_cat', itemId: 'item_xyz' });

            expect(res.status).toBe(400);
        });
    });

    describe('PUT /api/progress/gamification/active', () => {
        it('should allow setting unlocked assets as active', async () => {
            const { user, token } = await generateTestUser('student');

            // Unlock a frame first
            await User.findByIdAndUpdate(user._id, { unlockedFrames: ['default', 'gold'] });

            const res = await request(app)
                .put('/api/progress/gamification/active')
                .set('Authorization', `Bearer ${token}`)
                .send({ activeFrame: 'gold' });

            expect(res.status).toBe(200);
            expect(res.body.data.activeFrame).toBe('gold');

            // Verify in database
            const dbUser = await User.findById(user._id);
            expect(dbUser.activeFrame).toBe('gold');
        });

        it('should block setting locked assets as active', async () => {
            const { token } = await generateTestUser('student');

            const res = await request(app)
                .put('/api/progress/gamification/active')
                .set('Authorization', `Bearer ${token}`)
                .send({ activeFrame: 'diamond' }); // diamond is locked by default

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/frame is locked/i);
        });
    });
});
