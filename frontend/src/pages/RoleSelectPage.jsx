import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { GraduationCap, Presentation } from 'lucide-react';

const RoleSelectPage = () => {
    const navigate = useNavigate();
    const setRole = useAuthStore(state => state.setRole);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelectRole = async (role) => {
        setIsSubmitting(true);
        try {
            await setRole(role);
            if (role === 'student') {
                navigate('/');
            } else {
                navigate('/instructor');
            }
        } catch (error) {
            alert('Failed to set role. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 pb-32 font-sans">
            <div className="mb-12 flex items-center gap-4">
                <div className="w-12 h-12 bg-studylabs-blue rounded-xl flex items-center justify-center text-white font-bold shadow-xl shadow-blue-200 text-2xl">
                    S
                </div>
                <h1 className="font-display font-extrabold text-4xl text-gray-900 tracking-tight">StudyLabs</h1>
            </div>

            <h2 className="text-xl font-medium text-gray-500 mb-8">You're almost in. Select your role.</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                {/* Student Card */}
                <button 
                    onClick={() => handleSelectRole('student')}
                    disabled={isSubmitting}
                    className="bg-white p-8 rounded-3xl border-2 border-transparent hover:border-studylabs-blue shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-6 group disabled:opacity-50"
                >
                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-studylabs-blue group-hover:text-white text-studylabs-blue transition-colors">
                        <GraduationCap size={40} />
                    </div>
                    <div className="text-center">
                        <h3 className="font-display font-bold text-2xl text-gray-900 mb-2">Student</h3>
                        <p className="text-gray-500">Access your learning maps, quizzes, and track your progress.</p>
                    </div>
                </button>

                {/* Instructor Card */}
                <button 
                    onClick={() => handleSelectRole('instructor')}
                    disabled={isSubmitting}
                    className="bg-white p-8 rounded-3xl border-2 border-transparent hover:border-purple-500 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-6 group disabled:opacity-50"
                >
                    <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white text-purple-500 transition-colors">
                        <Presentation size={40} />
                    </div>
                    <div className="text-center">
                        <h3 className="font-display font-bold text-2xl text-gray-900 mb-2">Instructor</h3>
                        <p className="text-gray-500">Manage courses, view analytics, and create new learning maps.</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default RoleSelectPage;
