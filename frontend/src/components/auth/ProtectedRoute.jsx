import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { isAuthenticated, role, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If user doesn't have a role yet and not on role-select page, redirect to role selection
    if (!role && !user?.role && window.location.pathname !== '/role-select') {
        return <Navigate to="/role-select" replace />;
    }

    // Check if route requires a specific role
    if (allowedRole) {
        // Support multi-role: check if user has the required role in their roles array
        const userRoles = user?.roles || (role ? [role] : []);
        const hasRequiredRole = userRoles.includes(allowedRole);

        if (!hasRequiredRole) {
            // User doesn't have the required role, redirect to their primary dashboard
            if (role === 'student' || (user?.roles?.includes('student') && !user?.roles?.includes('instructor'))) {
                return <Navigate to="/" replace />;
            }
            if (role === 'instructor' || user?.roles?.includes('instructor')) {
                return <Navigate to="/instructor" replace />;
            }
            // If somehow still no role, go to role select
            return <Navigate to="/role-select" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
