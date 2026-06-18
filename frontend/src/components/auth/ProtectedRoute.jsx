import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { isAuthenticated, role, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const userRoles = user?.roles || (role ? [role] : []);
    const isAdmin = userRoles.includes('admin');

    // Admins bypass the role-select flow
    if (!role && !user?.role && !isAdmin && window.location.pathname !== '/role-select') {
        return <Navigate to="/role-select" replace />;
    }

    // Check if route requires a specific role
    if (allowedRole) {
        const hasRequiredRole = userRoles.includes(allowedRole);

        if (!hasRequiredRole) {
            // Redirect to the user's primary dashboard
            if (isAdmin) return <Navigate to="/admin" replace />;
            if (role === 'student' || (user?.roles?.includes('student') && !user?.roles?.includes('instructor'))) {
                return <Navigate to="/" replace />;
            }
            if (role === 'instructor' || user?.roles?.includes('instructor')) {
                return <Navigate to="/instructor" replace />;
            }
            return <Navigate to="/role-select" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
