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
    if (allowedRole) {
        const hasRequiredRole = role ? role === allowedRole : userRoles.includes(allowedRole);

        if (!hasRequiredRole) {
            // Redirect to the user's primary dashboard
            if (isAdmin) return <Navigate to="/admin" replace />;
            if (role === 'instructor' || userRoles.includes('instructor')) {
                return <Navigate to="/instructor" replace />;
            }
            if (role === 'student' || userRoles.includes('student')) {
                return <Navigate to="/" replace />;
            }
            return <Navigate to="/role-select" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
