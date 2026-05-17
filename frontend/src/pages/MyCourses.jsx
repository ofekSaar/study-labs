import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from '../components/layout/StudentLayout';
import useCourseStore from '../store/courseStore';
import { Search, BookOpen, Clock, Play, GraduationCap } from 'lucide-react';

const MyCourses = () => {
    const navigate = useNavigate();
    const { courses, fetchCourses, isLoading } = useCourseStore();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Filter only approved enrollments (handled by fetchCourses logic in store)
    const enrolledCourses = courses.filter(course => 
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        course.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <StudentLayout title="My Courses">
            {/* Ambient background orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] max-w-[1600px] mx-auto px-6 py-8 pb-32 animate-fade-in">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-black text-white drop-shadow-md tracking-tight">My Courses</h1>
                        <p className="text-white/60 text-lg mt-1 font-medium">Pick up where you left off in your learning journey.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                            <input 
                                type="text"
                                placeholder="Search my courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white placeholder-white/40 focus:border-indigo-400 focus:bg-white/10 focus:outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                {/* Course Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
                    </div>
                ) : enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map(course => (
                            <div 
                                key={course.id} 
                                className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                            >
                                {/* Inner glow hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 ${course.color || 'bg-indigo-500/20 text-indigo-400'}`}>
                                        <BookOpen size={28} className="drop-shadow-md" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">Progress</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-black/40 rounded-full overflow-hidden shadow-inner">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" 
                                                    style={{ width: `${course.progress || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-black text-emerald-400 drop-shadow-md">{Math.round(course.progress || 0)}%</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="relative z-10 flex-1 flex flex-col">
                                    <h3 className="font-display font-bold text-2xl text-white mb-2 line-clamp-2 drop-shadow-md">
                                        {course.title || 'Untitled Course'}
                                    </h3>
                                    <p className="text-white/60 text-sm mb-6 line-clamp-2 flex-1">
                                        {course.description || 'No description provided.'}
                                    </p>
                                    
                                    <div className="mt-auto">
                                        <div className="flex items-center gap-3 mb-6 bg-black/20 p-3 rounded-2xl border border-white/5">
                                            <img 
                                                src={course.instructor?.avatar || 'https://via.placeholder.com/150'} 
                                                alt={course.instructor?.name} 
                                                className="w-10 h-10 rounded-full bg-white/10 border border-white/20"
                                            />
                                            <div className="text-sm">
                                                <p className="text-white font-bold">{course.instructor?.name || 'Instructor'}</p>
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Course Creator</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/course/${course.id}`)}
                                            className="w-full bg-indigo-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-indigo-400 transition-colors"
                                        >
                                            <Play size={18} fill="currentColor" />
                                            Continue Learning
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 border-dashed relative z-10">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 text-white/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <GraduationCap size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-white drop-shadow-md mb-3">No courses yet</h3>
                        <p className="text-white/60 mb-8 max-w-md mx-auto text-lg">
                            {searchTerm ? 'No enrolled courses match your search.' : 'You haven\'t enrolled in any courses yet. Start your journey today!'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => navigate('/enrollments')}
                                className="bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-indigo-400 transition-colors"
                            >
                                Browse Catalog
                            </button>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default MyCourses;
