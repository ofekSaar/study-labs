import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { isAuthenticated, role, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const userRoles = user?.roles?.length > 0 ? user.roles : role ? [role] : [];
    const isAdmin = userRoles.includes('admin');

    // Admins bypass the role-select flow
    if (!role && !user?.role && !isAdmin && window.location.pathname !== '/role-select') {
        return <Navigate to="/role-select" replace />;
    }

    // Check if route requires a specific role.
    // Use primary `role` field when set so that an instructor who also has
    // the student role is not silently allowed into student-only routes.
    // Admin routes are the exception: anyone holding the admin role may enter,
    // whatever their primary role — otherwise the `isAdmin` redirect below
    // would bounce /admin back to itself and render a blank page.
    if (allowedRole) {
        const hasRequiredRole =
            allowedRole === 'admin'
                ? isAdmin
                : role
                  ? role === allowedRole
                  : userRoles.includes(allowedRole);

        if (!hasRequiredRole) {
            // Redirect to the user's active role dashboard, or default to first available
            if (isAdmin) return <Navigate to="/admin" replace />;
            
            const activeRole = role || (userRoles.includes('instructor') ? 'instructor' : 'student');
            if (activeRole === 'instructor') {
                return <Navigate to="/instructor" replace />;
            }
            if (activeRole === 'student') {
                return <Navigate to="/" replace />;
            }
            return <Navigate to="/role-select" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
