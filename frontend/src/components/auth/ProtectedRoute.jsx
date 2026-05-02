import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { isAuthenticated, role } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && role !== allowedRole) {
        // Redirect to appropriate dashboard based on actual role
        if (role === 'student') return <Navigate to="/" replace />;
        if (role === 'instructor') return <Navigate to="/instructor" replace />;
    }

    return children;
};

export default ProtectedRoute;
