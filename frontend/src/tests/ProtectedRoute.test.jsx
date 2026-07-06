import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { act } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import useAuthStoreModule from '../store/authStore';

const useAuthStore = useAuthStoreModule.default || useAuthStoreModule;

jest.mock('../store/gamificationStore', () => {
    return {
        __esModule: true,
        default: {
            getState: () => ({
                fetchGamificationState: jest.fn(),
            }),
        },
    };
});

const renderAt = (path) =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/login" element={<div>Login Page</div>} />
                <Route path="/role-select" element={<div>Role Select</div>} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute allowedRole="student">
                            <div>Student Home</div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/instructor"
                    element={
                        <ProtectedRoute allowedRole="instructor">
                            <div>Instructor Home</div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute allowedRole="admin">
                            <div>Admin Panel</div>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </MemoryRouter>
    );

const setAuth = (state) => {
    act(() => {
        useAuthStore.setState({ isAuthenticated: true, user: null, role: null, ...state });
    });
};

describe('ProtectedRoute', () => {
    beforeEach(() => {
        act(() => {
            useAuthStore.setState({ isAuthenticated: false, user: null, role: null });
        });
    });

    test('redirects unauthenticated users to login', () => {
        renderAt('/');
        expect(screen.getByText('Login Page')).toBeTruthy();
    });

    test('lets a user with a matching primary role through', () => {
        setAuth({ role: 'student', user: { role: 'student', roles: ['student'] } });
        renderAt('/');
        expect(screen.getByText('Student Home')).toBeTruthy();
    });

    test('redirects an instructor away from student-only routes', () => {
        setAuth({
            role: 'instructor',
            user: { role: 'instructor', roles: ['instructor', 'student'] },
        });
        renderAt('/');
        expect(screen.getByText('Instructor Home')).toBeTruthy();
    });

    test('lets a primary-role admin into admin routes', () => {
        setAuth({ role: 'admin', user: { role: 'admin', roles: ['admin'] } });
        renderAt('/admin');
        expect(screen.getByText('Admin Panel')).toBeTruthy();
    });

    test('lets an admin in by roles even when their primary role differs', () => {
        // Regression: this used to redirect /admin to itself and render a blank page
        setAuth({
            role: 'student',
            user: { role: 'student', roles: ['student', 'admin'] },
        });
        renderAt('/admin');
        expect(screen.getByText('Admin Panel')).toBeTruthy();
    });

    test('still redirects non-admins away from admin routes', () => {
        setAuth({ role: 'student', user: { role: 'student', roles: ['student'] } });
        renderAt('/admin');
        expect(screen.getByText('Student Home')).toBeTruthy();
    });
});
