import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { GraduationCap, Presentation, Check } from 'lucide-react';

const RoleSelectPage = () => {
    const navigate = useNavigate();
    const { user, role, setRole } = useAuthStore();
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If user already has a role, redirect them
    useEffect(() => {
        if (role || user?.role) {
            const userRole = role || user?.role;
            if (userRole === 'student') {
                navigate('/', { replace: true });
            } else if (userRole === 'instructor') {
                navigate('/instructor', { replace: true });
            }
        }
    }, [role, user?.role, navigate]);

    const toggleRole = (selectedRole) => {
        if (selectedRoles.includes(selectedRole)) {
            setSelectedRoles(selectedRoles.filter(r => r !== selectedRole));
        } else {
            setSelectedRoles([...selectedRoles, selectedRole]);
        }
    };

    const handleContinue = async () => {
        if (selectedRoles.length === 0) {
            alert('Please select at least one role.');
            return;
        }

        setIsSubmitting(true);
        try {
            await setRole(selectedRoles);

            // Navigate based on primary role (instructor takes priority)
            if (selectedRoles.includes('instructor')) {
                navigate('/instructor', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch (error) {
            console.error('Role selection error:', error);
            // Check if the error is because role is already set
            if (error.message?.includes('already set')) {
                // User already has a role, just redirect
                const currentRole = user?.role || role;
                if (currentRole === 'student') {
                    navigate('/', { replace: true });
                } else if (currentRole === 'instructor') {
                    navigate('/instructor', { replace: true });
                } else {
                    alert('Your account already has a role assigned. Logging out...');
                    navigate('/login', { replace: true });
                }
            } else {
                alert('Failed to set role. Please try again.');
            }
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        useAuthStore.getState().logout();
        navigate('/login', { replace: true });
    };

    const isSelected = (roleToCheck) => selectedRoles.includes(roleToCheck);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 pb-32 font-sans relative transition-colors duration-300">
            {/* Logout button */}
            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 text-sm text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white font-medium transition"
            >
                Logout
            </button>

            <div className="mb-12 flex items-center gap-4">
                <div className="w-12 h-12 bg-studylabs-blue rounded-xl flex items-center justify-center text-white font-bold shadow-xl shadow-blue-200/50 dark:shadow-none text-2xl">
                    S
                </div>
                <h1 className="font-display font-extrabold text-4xl text-slate-900 dark:text-white tracking-tight">StudyLabs</h1>
            </div>

            <h2 className="text-xl font-medium text-slate-500 dark:text-white/60 mb-2">You're almost in. Select your role(s).</h2>
            <p className="text-sm text-slate-400 dark:text-white/40 mb-8">You can select both if you want to teach and learn!</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
                {/* Student Card */}
                <button
                    onClick={() => toggleRole('student')}
                    disabled={isSubmitting}
                    className={`bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 shadow-lg hover:shadow-xl dark:shadow-none hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-6 group disabled:opacity-50 relative ${
                        isSelected('student')
                            ? 'border-studylabs-blue ring-4 ring-blue-100 dark:ring-blue-950/40'
                            : 'border-transparent dark:border-white/5 hover:border-studylabs-blue dark:hover:border-studylabs-blue'
                    }`}
                >
                    {isSelected('student') && (
                        <div className="absolute top-4 right-4 w-8 h-8 bg-studylabs-blue rounded-full flex items-center justify-center">
                            <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                    )}
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected('student')
                            ? 'bg-studylabs-blue text-white'
                            : 'bg-blue-50 dark:bg-blue-950/20 text-studylabs-blue group-hover:bg-studylabs-blue group-hover:text-white'
                    }`}>
                        <GraduationCap size={40} />
                    </div>
                    <div className="text-center">
                        <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-2">Student</h3>
                        <p className="text-slate-500 dark:text-white/60">Access your learning maps, quizzes, and track your progress.</p>
                    </div>
                </button>

                {/* Instructor Card */}
                <button
                    onClick={() => toggleRole('instructor')}
                    disabled={isSubmitting}
                    className={`bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 shadow-lg hover:shadow-xl dark:shadow-none hover:-translate-y-1 transition-all duration-300 flex flex-col items-center gap-6 group disabled:opacity-50 relative ${
                        isSelected('instructor')
                            ? 'border-purple-500 ring-4 ring-purple-100 dark:ring-purple-950/40'
                            : 'border-transparent dark:border-white/5 hover:border-purple-500 dark:hover:border-purple-500'
                    }`}
                >
                    {isSelected('instructor') && (
                        <div className="absolute top-4 right-4 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check size={20} className="text-white" strokeWidth={3} />
                        </div>
                    )}
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                        isSelected('instructor')
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-50 dark:bg-purple-950/20 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'
                    }`}>
                        <Presentation size={40} />
                    </div>
                    <div className="text-center">
                        <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-2">Instructor</h3>
                        <p className="text-slate-500 dark:text-white/60">Manage courses, view analytics, and create new learning maps.</p>
                    </div>
                </button>
            </div>

            {/* Continue Button */}
            <button
                onClick={handleContinue}
                disabled={isSubmitting || selectedRoles.length === 0}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-12 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                {isSubmitting ? 'Setting up...' : 'Continue'}
            </button>

            {selectedRoles.length > 0 && (
                <p className="mt-4 text-sm text-slate-500 dark:text-white/40">
                    {selectedRoles.length === 2
                        ? '🎉 Great! You can both teach and learn'
                        : `Selected: ${selectedRoles[0].charAt(0).toUpperCase() + selectedRoles[0].slice(1)}`
                    }
                </p>
            )}
        </div>
    );
};

export default RoleSelectPage;
