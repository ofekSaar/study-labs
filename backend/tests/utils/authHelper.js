import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

export const generateTestUser = async (role = 'student') => {
    const user = await User.create({
        googleId: `test-google-id-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        role: role,
        avatar: 'http://example.com/avatar.png'
    });

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
    );

    return { user, token };
};
