import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../components/layout/StudentLayout';
import InstructorLayout from '../components/layout/InstructorLayout';
import GameMapComponent from '../components/map/GameMap';
import { ChevronLeft, Loader2, RotateCcw } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useCourseStore from '../store/courseStore';
import { io } from 'socket.io-client';

/** Total generation attempts allowed (1 initial + 1 retry) — mirrors the backend cap. */
const MAX_GENERATION_ATTEMPTS = 2;

const CourseMap = () => {
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const { fetchCourseNodes, regenerateCourse, courses, isLoading: storeLoading } = useCourseStore();
    const [localLoading, setLocalLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [retryError, setRetryError] = useState(null);

    const Layout = role === 'instructor' ? InstructorLayout : StudentLayout;

    useEffect(() => {
        const loadNodes = async () => {
            if (courseId) {
                await fetchCourseNodes(courseId);
                setLocalLoading(false);
            }
        };
        loadNodes();
    }, [courseId, fetchCourseNodes]);

    // Refresh nodes when window regains focus (user comes back from lesson)
    useEffect(() => {
        const handleFocus = () => {
            if (courseId && !localLoading) {
                fetchCourseNodes(courseId);
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [courseId, localLoading, fetchCourseNodes]);

    const course = courses.find(c => c.id === courseId || c._id === courseId);

    const attemptsUsed = course?.generationAttempts || 1;
    const canRetry = attemptsUsed < MAX_GENERATION_ATTEMPTS;

    const handleRetry = async () => {
        setRetrying(true);
        setRetryError(null);
        try {
            await regenerateCourse(courseId);
            // Store flips status to 'generating'; the poller below picks it up automatically.
        } catch (error) {
            setRetryError(error.message || 'Failed to restart generation.');
        } finally {
            setRetrying(false);
        }
    };

    // Socket.io real-time updates while roadmap is generating
    useEffect(() => {
        if (!courseId) return;

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
        const socket = io(API_BASE_URL, {
            withCredentials: true
        });

        socket.on('connect', () => {
            socket.emit('join_course', courseId);
        });

        socket.on('course_generation_status', async (data) => {
            if (data.courseId === courseId) {
                await fetchCourseNodes(courseId);
            }
        });

        const isGenerating = course?.generationStatus === 'generating';

        // Periodic backup poll as a robust fallback
        const backupInterval = setInterval(async () => {
            if (isGenerating) {
                await fetchCourseNodes(courseId);
            }
        }, 10000);

        return () => {
            socket.disconnect();
            clearInterval(backupInterval);
        };
    }, [courseId, course?.generationStatus, fetchCourseNodes]);
    
    // Map backend status to frontend map statuses
    const nodes = (course?.nodes || []).map((node, index) => {
        // Create descriptive label based on type
        let label = node.title;

        // If title is too generic or empty, use type prefix
        if (!label || label.trim().length === 0) {
            label = `${node.type.charAt(0).toUpperCase() + node.type.slice(1)} ${index + 1}`;
        }

        return {
            ...node,
            label,
            status: role === 'instructor' ? 'completed' : (node.status === 'current' ? 'active' : (node.status || 'locked')),
            onClick: () => {
                if (node.type === 'quiz' || node.type === 'lesson') {
                    navigate(`/course/${courseId}/lesson/${node._id}`);
                }
            }
        };
    });

    if (localLoading || storeLoading) {
        return (
            <Layout title="Loading Course...">
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-studylabs-blue" />
                    <p className="text-gray-500 font-medium">Generating your learning path...</p>
                </div>
            </Layout>
        );
    }

    if (!course) {
        return (
            <Layout title="Course Not Found">
                <div className="text-center p-4 sm:p-8 md:p-12">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Course Not Found</h2>
                    <button onClick={() => navigate(-1)} className="text-studylabs-blue font-bold flex items-center gap-2 mx-auto">
                        <ChevronLeft size={20} /> Go Back
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={course.title}>
            <div className="min-h-screen md:min-h-0 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">

                {/* Mobile-only Course Header */}
                <div className="md:hidden px-4 py-4 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/5">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition text-slate-700 dark:text-white"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-display font-bold text-xl">{course.title}</h1>
                    <div className="w-10" />
                </div>

                {/* Content Container */}
                <div className="bg-white dark:bg-slate-900/60 md:rounded-3xl md:p-8 md:shadow-sm dark:shadow-none border border-transparent dark:border-white/5 md:mx-6 md:my-6 backdrop-blur-md">

                    {/* Streak Banner */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-accent-yellow/20 backdrop-blur-md md:bg-orange-50 dark:md:bg-orange-950/20 px-6 py-2 rounded-full border border-accent-yellow/50 md:border-orange-100 dark:md:border-orange-900/30 flex items-center gap-3">
                            <span className="text-accent-yellow md:text-orange-600 font-bold">Learning Path</span>
                            <span className="text-2xl">🗺️</span>
                            {role === 'student' && nodes.length > 0 && (
                                <span className="text-accent-yellow md:text-orange-600 font-bold text-sm">
                                    {nodes.filter(n => n.status === 'completed').length}/{nodes.length}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Map Container - Centered and Contained on Desktop */}
                    <div className="px-4 pb-20 md:pb-0 max-w-xl mx-auto">
                        {nodes.length > 0 ? (
                            <GameMapComponent nodes={nodes} />
                        ) : course?.generationStatus === 'failed' ? (
                            <div className="text-center py-12 sm:py-16 px-4 bg-red-50 dark:bg-red-950/10 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/20">
                                <p className="text-red-500 dark:text-red-400 font-bold text-lg">Generation Failed</p>
                                <p className="text-sm text-red-400 dark:text-red-500/60 mt-2">{course.generationError || 'An error occurred during AI generation.'}</p>

                                {role === 'instructor' ? (
                                    canRetry ? (
                                        <>
                                            <button
                                                onClick={handleRetry}
                                                disabled={retrying}
                                                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-studylabs-blue text-white text-sm font-bold shadow-sm hover:bg-studylabs-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <RotateCcw size={16} className={retrying ? 'animate-spin' : ''} />
                                                {retrying ? 'Restarting…' : 'Retry Generation'}
                                            </button>
                                            <p className="text-xs text-red-300 dark:text-red-500/40 mt-3">
                                                You have 1 retry available.
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs font-medium text-red-400 dark:text-red-500/60 mt-6">
                                            Maximum retries reached — this course can no longer be regenerated.
                                        </p>
                                    )
                                ) : (
                                    <p className="text-xs text-red-300 dark:text-red-500/40 mt-4">Please contact your instructor.</p>
                                )}

                                {retryError && (
                                    <p className="text-xs text-red-500 dark:text-red-400 mt-3 max-w-sm mx-auto">{retryError}</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/5">
                                <Loader2 className="w-8 h-8 animate-spin text-studylabs-blue mx-auto mb-4" />
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Current Status</p>
                                <p className="text-sm font-medium text-studylabs-blue animate-pulse">
                                    {course?.generationProgress || 'AI is generating your roadmap...'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CourseMap;
