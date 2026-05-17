import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InstructorLayout from '../components/layout/InstructorLayout';
import useCourseStore from '../store/courseStore';
import { Search, BookOpen, Clock, Users, ArrowRight, Loader2, AlertCircle, Trash2 } from 'lucide-react';

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
                    style={{ background: 'radial-gradient(circle, rgba(79,110,247,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] max-w-6xl mx-auto px-6 py-8 pb-32 animate-fade-in">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-black text-white drop-shadow-md tracking-tight">Managed Courses</h1>
                        <p className="text-white/60 text-lg mt-1 font-medium">View, search, and manage all your created courses.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input 
                                type="text"
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white placeholder-white/40 focus:border-purple-400 focus:bg-white/10 focus:outline-none transition-all shadow-inner"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/instructor/create')}
                            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:bg-purple-500 transition-colors whitespace-nowrap flex items-center gap-2"
                        >
                            + New
                        </button>
                    </div>
                </div>

                {/* Course Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
                    </div>
                ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map(course => (
                            <div 
                                key={course.id} 
                                className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                            >
                                {/* Inner glow hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 ${course.color || 'bg-purple-500/20 text-purple-400'}`}>
                                        <BookOpen size={28} className="drop-shadow-md" />
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-inner ${
                                        course.generationStatus === 'generating' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' :
                                        course.generationStatus === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        course.isPublished ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                    }`}>
                                        {course.generationStatus === 'generating' && <Loader2 size={14} className="animate-spin" />}
                                        {course.generationStatus === 'failed' && <AlertCircle size={14} />}
                                        {course.generationStatus === 'generating' ? 'Generating AI' :
                                         course.generationStatus === 'failed' ? 'Failed' :
                                         course.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                
                                <div className="relative z-10 flex-1 flex flex-col">
                                    <h3 className="font-display font-bold text-2xl text-white mb-2 line-clamp-2 drop-shadow-md">
                                        {course.title || 'Untitled Course'}
                                    </h3>
                                    <p className="text-white/60 text-sm mb-6 line-clamp-3 flex-1">
                                        {course.description || 'No description provided.'}
                                    </p>
                                    
                                    <div className="mt-auto">
                                        <hr className="border-white/10 mb-5" />
                                        <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl border border-white/5">
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wide">
                                                    <Users size={16} className="text-white/40" />
                                                    <span>{course.level || 'Beginner'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-wide">
                                                    <Clock size={16} className="text-white/40" />
                                                    <span>{course.department || 'Other'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(course.id, course.title)}
                                                    disabled={deletingId === course.id}
                                                    className="w-10 h-10 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 shadow-inner"
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
                                                    className="w-10 h-10 bg-white/10 hover:bg-purple-600 text-white border border-white/20 rounded-xl flex items-center justify-center transition-colors shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                                                    title="View course"
                                                >
                                                    <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 border-dashed relative z-10">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 text-white/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-white drop-shadow-md mb-3">No courses found</h3>
                        <p className="text-white/60 mb-8 max-w-md mx-auto text-lg">
                            {searchTerm ? 'Try adjusting your search filters.' : 'You haven\'t created any courses yet.'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => navigate('/instructor/create')}
                                className="bg-purple-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:bg-purple-500 transition-colors"
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
