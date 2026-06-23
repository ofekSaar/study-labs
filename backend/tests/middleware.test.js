import jwt from 'jsonwebtoken';
import { jest } from '@jest/globals';
import { connectTestDB, closeTestDB, clearTestDB } from './utils/testSetup.js';
import { generateTestUser, generateTestAdmin } from './utils/authHelper.js';
import User from '../models/User.js';
import { authenticate, authorize, requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import errorHandler from '../middleware/errorHandler.js';
import { body } from 'express-validator';
import createError from 'http-errors';

// Helper: create a minimal mock Express request
const mockReq = (overrides = {}) => ({
    headers: {},
    body: {},
    ...overrides,
});

// Helper: create a mock response
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Middleware', () => {
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

    describe('authenticate', () => {
        it('should return 401 when Authorization header is missing', async () => {
            const req = mockReq();
            const res = mockRes();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });

        it('should return 401 when Authorization header is malformed', async () => {
            const req = mockReq({ headers: { authorization: 'Token abc123' } });
            const res = mockRes();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });

        it('should return 401 for an invalid token', async () => {
            const req = mockReq({ headers: { authorization: 'Bearer not.a.valid.jwt' } });
            const res = mockRes();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });

        it('should return 401 for an expired token', async () => {
            const expiredToken = jwt.sign(
                { userId: '000000000000000000000001' },
                'test_secret',
                { expiresIn: '-1s' }
            );
            const req = mockReq({ headers: { authorization: `Bearer ${expiredToken}` } });
            const res = mockRes();
            const next = jest.fn();

            await authenticate(req, res, next);

            const err = next.mock.calls[0][0];
            expect(err.status).toBe(401);
            expect(err.message).toMatch(/expired/i);
        });

        it('should return 401 when user does not exist in DB', async () => {
            const token = jwt.sign(
                { userId: '000000000000000000000001' },
                'test_secret',
                { expiresIn: '1h' }
            );
            const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
            const res = mockRes();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });

        it('should attach req.user and call next for a valid token', async () => {
            const { user, token } = await generateTestUser('student');

            const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
            const res = mockRes();
            const next = jest.fn();

            await authenticate(req, res, next);

            expect(next).toHaveBeenCalledWith(); // no error
            expect(req.user).toBeDefined();
            expect(String(req.user._id)).toBe(String(user._id));
        });
    });

    describe('authorize', () => {
        it('should return 401 when req.user is not set', () => {
            const req = mockReq();
            const res = mockRes();
            const next = jest.fn();

            authorize('student')(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });

        it('should return 403 when user has no roles', () => {
            const req = mockReq({ user: { role: null, roles: [] } });
            const res = mockRes();
            const next = jest.fn();

            authorize('student')(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
        });

        it('should return 403 when user does not have required role', () => {
            const req = mockReq({ user: { role: 'instructor', roles: ['instructor'] } });
            const res = mockRes();
            const next = jest.fn();

            authorize('student')(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
        });

        it('should call next() when user has the required role', () => {
            const req = mockReq({ user: { role: 'student', roles: ['student'] } });
            const res = mockRes();
            const next = jest.fn();

            authorize('student')(req, res, next);

            expect(next).toHaveBeenCalledWith(); // no error
        });

        it('should allow access when user has one of multiple allowed roles', () => {
            const req = mockReq({ user: { role: 'instructor', roles: ['instructor'] } });
            const res = mockRes();
            const next = jest.fn();

            authorize('student', 'instructor')(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should allow multi-role users to pass with any matching role', () => {
            const req = mockReq({ user: { role: 'instructor', roles: ['student', 'instructor'] } });
            const res = mockRes();
            const next = jest.fn();

            authorize('student')(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('requireAdmin', () => {
        it('should return 401 when req.user is not set', () => {
            const req = mockReq();
            const res = mockRes();
            const next = jest.fn();

            requireAdmin(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });

        it('should return 403 for non-admin users', () => {
            const req = mockReq({ user: { role: 'student', roles: ['student'] } });
            const res = mockRes();
            const next = jest.fn();

            requireAdmin(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
        });

        it('should call next() for admin users', () => {
            const req = mockReq({ user: { role: 'admin', roles: ['admin'] } });
            const res = mockRes();
            const next = jest.fn();

            requireAdmin(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });
    });

    describe('validate', () => {
        it('should call next() when there are no validation errors', async () => {
            const req = mockReq({ body: { name: 'Valid Name' } });
            const res = mockRes();
            const next = jest.fn();

            // Run a passing validator
            await body('name').notEmpty().run(req);
            validate(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should call next() with 400 error when validation fails', async () => {
            const req = mockReq({ body: { name: '' } });
            const res = mockRes();
            const next = jest.fn();

            await body('name').notEmpty().withMessage('Name is required').run(req);
            validate(req, res, next);

            const err = next.mock.calls[0][0];
            expect(err.status).toBe(400);
            expect(err.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'name', message: 'Name is required' }),
                ])
            );
        });
    });

    describe('errorHandler', () => {
        it('should respond with status and message from http-errors', () => {
            const err = createError(404, 'Resource not found');
            const req = mockReq();
            const res = mockRes();
            const next = jest.fn();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'error', message: 'Resource not found' })
            );
        });

        it('should default to 500 for generic Error', () => {
            const err = new Error('Something broke');
            const req = mockReq();
            const res = mockRes();
            const next = jest.fn();

            errorHandler(err, req, res, next);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should include errors array when present on the error', () => {
            const err = createError(400, 'Validation failed');
            err.errors = [{ field: 'email', message: 'Invalid email' }];
            const req = mockReq();
            const res = mockRes();
            const next = jest.fn();

            errorHandler(err, req, res, next);

            const responseBody = res.json.mock.calls[0][0];
            expect(responseBody.errors).toBeDefined();
            expect(responseBody.errors[0].field).toBe('email');
        });
    });
});
