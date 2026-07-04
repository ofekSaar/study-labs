import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Spinner from '../components/common/Spinner';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const handleAuthCallback = useAuthStore((state) => state.handleAuthCallback);
    const [error, setError] = useState(null);

    useEffect(() => {
        const processCallback = async () => {
            const token = searchParams.get('token');
            const errParam = searchParams.get('error');

            if (errParam) {
                setError('Authentication failed.');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            if (token) {
                const user = await handleAuthCallback(token);
                if (user) {
                    if (!user.role) {
                        navigate('/role-select');
                    } else if (user.role === 'student') {
                        navigate('/');
                    } else {
                        navigate('/instructor');
                    }
                } else {
                    setError('Failed to fetch user profile.');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } else {
                navigate('/login');
            }
        };

        processCallback();
    }, [searchParams, handleAuthCallback, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500 font-bold mb-2">{error}</p>
                    <p className="text-gray-500 text-sm">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <Spinner className="mb-4" label="Completing sign in" />
                <p className="text-gray-500 font-medium">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
