import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../components/layout/StudentLayout';
import InstructorLayout from '../components/layout/InstructorLayout';
import GameMapComponent from '../components/map/GameMap';
import QuizEditorModal from '../components/quiz/QuizEditorModal';
import AnnouncementModal from '../components/course/AnnouncementModal';
import AnnouncementsPanel from '../components/course/AnnouncementsPanel';
import { ChevronLeft, Loader2, RotateCcw, UploadCloud, X, Pencil, Megaphone } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useCourseStore from '../store/courseStore';
import { io } from 'socket.io-client';
import api from '../utils/api';

/** Total generation attempts allowed (1 initial + 1 retry) — mirrors the backend cap. */
const MAX_GENERATION_ATTEMPTS = 2;

const CourseMap = () => {
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const { fetchCourseNodes, regenerateCourse, fetchAnnouncements, courses, isLoading: storeLoading } = useCourseStore();
    const [localLoading, setLocalLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [retryError, setRetryError] = useState(null);

    // Upload materials state
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    // Quiz editor state (instructor only)
    const [editingQuizNode, setEditingQuizNode] = useState(null);

    // Announcement modal state (instructor only)
    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

    const handleUploadSubmit = async () => {
        if (uploadFiles.length === 0) return;
        setUploading(true);
        setUploadError(null);
        try {
            const formData = new FormData();
            uploadFiles.forEach(file => {
                formData.append('materials', file);
            });
            await api.upload(`/api/courses/${courseId}/materials`, formData);
            
            // Re-fetch nodes to refresh status
            await fetchCourseNodes(courseId);
            setIsUploadOpen(false);
            setUploadFiles([]);
        } catch (error) {
            setUploadError(error.message || 'Failed to upload materials.');
        } finally {
            setUploading(false);
        }
    };

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

    useEffect(() => {
        if (courseId) fetchAnnouncements(courseId);
    }, [courseId, fetchAnnouncements]);

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
                if (role === 'instructor') {
                    if (node.type === 'quiz') {
                        setEditingQuizNode(node);
                    } else if (node.type === 'lesson') {
                        navigate(`/instructor/course/${courseId}/lesson/${node._id}`);
                    }
                } else {
                    if (node.type === 'quiz' || node.type === 'lesson') {
                        navigate(`/course/${courseId}/lesson/${node._id}`);
                    }
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

                    {/* Instructor action bar */}
                    {role === 'instructor' && (
                        <div className="flex justify-center gap-3 mb-6 -mt-3 flex-wrap">
                            {course?.generationStatus !== 'generating' && (
                                <button
                                    onClick={() => setIsUploadOpen(true)}
                                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-[0_0_15px_rgba(147,51,234,0.2)] flex items-center gap-2 cursor-pointer animate-fade-in"
                                >
                                    <UploadCloud size={16} /> Add Materials
                                </button>
                            )}
                            <button
                                onClick={() => setIsAnnouncementOpen(true)}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-2 cursor-pointer animate-fade-in"
                            >
                                <Megaphone size={16} /> Announcements
                            </button>
                        </div>
                    )}

                    {/* Student announcements panel */}
                    {role === 'student' && (
                        <div className="max-w-xl mx-auto">
                            <AnnouncementsPanel />
                        </div>
                    )}

                    {/* Map Container - Centered and Contained on Desktop */}
                    <div className="px-4 pb-20 md:pb-0 max-w-xl mx-auto">
                        {nodes.length > 0 ? (
                            <>
                            <GameMapComponent nodes={nodes} />
                            {/* Quiz management panel — instructor only */}
                            {role === 'instructor' && nodes.filter(n => n.type === 'quiz').length > 0 && (
                                <div className="mt-8 border-t border-slate-200 dark:border-white/10 pt-6">
                                    <h3 className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-3">
                                        Quiz Management
                                    </h3>
                                    <div className="space-y-2">
                                        {nodes.filter(n => n.type === 'quiz').map(n => (
                                            <div
                                                key={n._id}
                                                className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                                            >
                                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate mr-3">
                                                    {n.label}
                                                </span>
                                                <button
                                                    onClick={() => setEditingQuizNode(n)}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-colors"
                                                >
                                                    <Pencil size={13} /> Edit Questions
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            </>
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

            {/* Upload Materials Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
                        <button
                            onClick={() => { setIsUploadOpen(false); setUploadFiles([]); setUploadError(null); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                        >
                            <X size={20} />
                        </button>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                            📤 Add Course Materials
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-4 font-medium">
                            Upload additional learning materials (PDF, PPTX, DOCX, XLSX, MP4). The AI will process them and update the relevant lessons in-place without resetting student progress.
                        </p>

                        <div className="space-y-4">
                            {/* File Selector */}
                            <label className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
                                <UploadCloud size={32} className="text-slate-400 mb-2" />
                                <span className="text-xs font-bold text-slate-600 dark:text-white/70">
                                    {uploadFiles.length > 0 ? `${uploadFiles.length} file(s) selected` : 'Click to select files'}
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.pptx,.docx,.xlsx,.mp4"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setUploadFiles(Array.from(e.target.files));
                                        }
                                    }}
                                />
                            </label>

                            {/* Selected Files List */}
                            {uploadFiles.length > 0 && (
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {uploadFiles.map((file, i) => (
                                        <div key={i} className="text-xs bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 p-2 rounded-xl flex items-center justify-between">
                                            <span className="truncate text-slate-700 dark:text-white/80 font-medium max-w-[200px]">{file.name}</span>
                                            <span className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {uploadError && (
                                <p className="text-xs text-red-500 font-semibold">{uploadError}</p>
                            )}

                            {/* Submit CTA */}
                            <button
                                onClick={handleUploadSubmit}
                                disabled={uploading || uploadFiles.length === 0}
                                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {uploading ? (
                                    <><Loader2 size={16} className="animate-spin" /> Processing...</>
                                ) : (
                                    'Start Processing Update'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Announcement Modal (instructor) */}
            {isAnnouncementOpen && (
                <AnnouncementModal
                    courseId={courseId}
                    onClose={() => setIsAnnouncementOpen(false)}
                />
            )}

            {/* Quiz Editor Modal */}
            {editingQuizNode && (
                <QuizEditorModal
                    nodeId={editingQuizNode._id}
                    nodeTitle={editingQuizNode.label || editingQuizNode.title}
                    onClose={() => setEditingQuizNode(null)}
                />
            )}
        </Layout>
    );
};

export default CourseMap;
