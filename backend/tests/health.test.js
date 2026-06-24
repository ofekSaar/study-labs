import request from 'supertest';
import app from '../server.js';
import { connectTestDB, closeTestDB } from './utils/testSetup.js';

describe('Health Check API', () => {
    beforeAll(async () => {
        await connectTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    it('should return 200 and status ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/non-existent-route');
        expect(res.status).toBe(404);
        expect(res.body.status).toBe('error');
    });
});
