import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

export const generateTestUser = async (role = 'student') => {
    const user = await User.create({
        provider: 'google',
        providerId: `test-google-id-${Date.now()}-${Math.random()}`,
        email: `test-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test User',
        role: role,
        roles: role ? [role] : [],
        avatar: 'http://example.com/avatar.png'
    });

    const token = jwt.sign(
        {
            userId: user._id,
            role: user.role,
            roles: user.roles || (user.role ? [user.role] : [])
        },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
    );

    return { user, token };
};

export const generateTestAdmin = async () => {
    const user = await User.create({
        provider: 'google',
        providerId: `test-admin-id-${Date.now()}-${Math.random()}`,
        email: `admin-${Date.now()}-${Math.random()}@example.com`,
        name: 'Test Admin',
        role: 'admin',
        roles: ['admin'],
        avatar: 'http://example.com/avatar.png'
    });

    const token = jwt.sign(
        { userId: user._id, role: 'admin', roles: ['admin'] },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
    );

    return { user, token };
};
