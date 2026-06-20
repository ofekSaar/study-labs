import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorLayout from '../components/layout/InstructorLayout';
import useCourseStore from '../store/courseStore';
import { getDeptStyle } from '../utils/departmentStyles';
import { Search, BookOpen, Clock, Users, ArrowRight, Loader2, AlertCircle, Trash2, GraduationCap, Sparkles } from 'lucide-react';

const ManagedCourses = () => {
    const navigate = useNavigate();
    const { courses, fetchAllCourses, deleteCourse, isLoading } = useCourseStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchAllCourses();
    }, [fetchAllCourses]);

    const handleDelete = async (courseId, courseTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
            return;
        }
        setDeletingId(courseId);
        try {
            await deleteCourse(courseId);
        } catch (error) {
            alert('Failed to delete course: ' + (error.message || 'Unknown error'));
        } finally {
            setDeletingId(null);
        }
    };

    // Filter courses based on search term
    const filteredCourses = courses.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <InstructorLayout title="Managed Courses">
            {/* Ambient background orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-32 animate-fade-in">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">Managed Courses</h1>
                        <p className="text-slate-500 dark:text-white/60 text-lg mt-1 font-medium">View, search, and manage all your created courses.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" size={18} />
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-md text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#D97757] focus:bg-white dark:focus:bg-slate-900/60 focus:outline-none transition-all shadow-sm focus:shadow-md dark:shadow-inner"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/instructor/create')}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_4px_15px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap flex items-center gap-2 text-sm"
                        >
                            + New Course
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                {!isLoading && (
                    <div className="flex items-center gap-3 mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-bold">
                            {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Total
                        </span>
                        {courses.filter(c => c.isPublished).length > 0 && (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                {courses.filter(c => c.isPublished).length} Published
                            </span>
                        )}
                        {courses.filter(c => c.generationStatus === 'generating').length > 0 && (
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-sm font-bold animate-pulse">
                                {courses.filter(c => c.generationStatus === 'generating').length} Generating
                            </span>
                        )}
                    </div>
                )}

                {/* Course Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map(course => {
                            const deptStyle = getDeptStyle(course.department);

                            return (
                                <div
                                    key={course.id}
                                    className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                                    style={{ '--glow-color': deptStyle.glow }}
                                >
                                    {/* Top accent stripe */}
                                    <div className="h-1 w-full bg-gradient-to-r from-[#D97757] to-[#7C3AED] rounded-t-3xl" />

                                    {/* Ambient Hover Glow */}
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                                        style={{ background: `radial-gradient(circle at 75% 20%, ${deptStyle.glow} 0%, transparent 60%)` }}
                                    />
                                    
                                    <div className="flex justify-between items-start mb-6 relative z-10 px-6 pt-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border ${deptStyle.iconBg}`}>
                                            <BookOpen size={28} className="drop-shadow-sm" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${deptStyle.bg}`}>
                                                {course.department || 'General'}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-inner ${
                                                course.generationStatus === 'generating' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse' :
                                                course.generationStatus === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                course.isPublished ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                            }`}>
                                                {course.generationStatus === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
                                                {course.generationStatus === 'generating' ? 'Generating' :
                                                 course.generationStatus === 'failed' ? 'Failed' :
                                                 course.isPublished ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="relative z-10 flex-1 flex flex-col px-6 pb-6">
                                        <h3 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2 line-clamp-2 drop-shadow-sm dark:drop-shadow-md group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {course.title || 'Untitled Course'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-white/60 text-sm mb-4 line-clamp-2 flex-1 font-medium leading-relaxed">
                                            {course.description || 'No description provided.'}
                                        </p>
                                        
                                        {course.aiEvaluation?.status === 'completed' && (
                                            <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">AI Judge Score</span>
                                                    <span className={`text-sm font-black ${course.aiEvaluation.score >= 80 ? 'text-emerald-500' : course.aiEvaluation.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                                        {course.aiEvaluation.score}/100
                                                    </span>
                                                </div>
                                                {course.aiEvaluation.feedback && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">
                                                        {course.aiEvaluation.feedback}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="mt-auto">
                                            <hr className="border-slate-200 dark:border-white/10 mb-4" />
                                            <div className="flex justify-between items-center bg-slate-50/50 dark:bg-black/25 p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                                                    <Users size={16} className="text-slate-400 dark:text-white/40" />
                                                    <span>{course.level || 'Beginner'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleDelete(course.id, course.title)}
                                                        disabled={deletingId === course.id}
                                                        className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 shadow-inner"
                                                        title="Delete course"
                                                    >
                                                        {deletingId === course.id ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={18} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/instructor/course/${course.id}`)}
                                                        className="w-10 h-10 bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/20 rounded-xl flex items-center justify-center transition-all shadow-[0_0_10px_rgba(124,58,237,0.3)] hover:shadow-[0_0_15px_rgba(124,58,237,0.5)] group-hover:scale-105 active:scale-95"
                                                        title="View course"
                                                    >
                                                        <ArrowRight size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white/70 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl relative z-10 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.01)] backdrop-blur-md">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-slate-400 dark:text-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <BookOpen size={40} className="text-purple-500 dark:text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md mb-3">No courses found</h3>
                        <p className="text-slate-500 dark:text-white/60 mb-8 max-w-md mx-auto text-lg font-medium leading-relaxed">
                            {searchTerm ? 'Try adjusting your search filters.' : 'You haven\'t created any courses yet.'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => navigate('/instructor/create')}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_22px_rgba(124,58,237,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                            >
                                Create Your First Course
                            </button>
                        )}
                    </div>
                )}
            </div>
        </InstructorLayout>
    );
};

export default ManagedCourses;
