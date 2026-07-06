import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../store/courseStore';
import { Search, Play, GraduationCap, BookMarked } from 'lucide-react';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';

const MyCourses = () => {
    const navigate = useNavigate();
    const { courses, fetchCourses, isLoading } = useCourseStore();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const enrolledCourses = courses.filter(
        (course) =>
            course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(217,119,87,0.12) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-[1] max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 pb-32 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">
                            My Courses
                        </h1>
                        <p className="text-slate-500 dark:text-white/60 text-base sm:text-lg mt-1 font-medium">
                            Pick up where you left off in your learning journey.
                        </p>
                    </div>
                    <div className="relative flex-1 md:w-80 max-w-sm">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search my courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#D97757] focus:bg-white dark:focus:bg-white/10 focus:outline-none transition-all shadow-sm dark:shadow-inner"
                        />
                    </div>
                </div>

                {/* Stats pill */}
                {!isLoading && (
                    <div className="flex items-center gap-2 mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D97757]/10 border border-[#D97757]/20 text-[#D97757] text-sm font-bold">
                            <BookMarked size={14} />
                            {enrolledCourses.length}{' '}
                            {enrolledCourses.length === 1 ? 'Course' : 'Courses'} Enrolled
                        </span>
                    </div>
                )}

                {/* Course Grid */}
                {isLoading ? (
                    <Spinner center label="Loading courses" />
                ) : enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map((course) => (
                            <div
                                key={course.id}
                                className="glass-card rounded-3xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                            >
                                {/* Top accent stripe */}
                                <div className="h-1 w-full bg-gradient-to-r from-[#D97757] to-[#7C3AED] rounded-t-3xl" />

                                {/* Inner glow hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#D97757]/8 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="p-6 flex flex-col flex-1 relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border bg-[#D97757]/15 border-[#D97757]/20 text-3xl">
                                            {course.courseAvatar || '📚'}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-1.5">
                                                Progress
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#D97757] to-[#C4613D] rounded-full shadow-[0_0_10px_rgba(217,119,87,0.5)]"
                                                        style={{
                                                            width: `${course.progress || 0}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm">
                                                    {Math.round(course.progress || 0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white mb-2 line-clamp-2 drop-shadow-sm dark:drop-shadow-md">
                                            {course.title || 'Untitled Course'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-white/60 text-sm mb-6 line-clamp-2 flex-1">
                                            {course.description || 'No description provided.'}
                                        </p>

                                        <div className="mt-auto">
                                            <div className="flex items-center gap-3 mb-4 bg-slate-100 dark:bg-black/20 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                                <img
                                                    src={
                                                        course.instructor?.avatar ||
                                                        'https://via.placeholder.com/150'
                                                    }
                                                    alt={
                                                        course.instructor?.name
                                                            ? `${course.instructor.name}'s avatar`
                                                            : 'Instructor avatar'
                                                    }
                                                    className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20"
                                                />
                                                <div className="text-sm">
                                                    <p className="text-slate-800 dark:text-white font-bold">
                                                        {course.instructor?.name || 'Instructor'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-widest mt-0.5">
                                                        Course Creator
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                variant="gradient"
                                                size="lg"
                                                fullWidth
                                                icon={Play}
                                                onClick={() => navigate(`/course/${course.id}`)}
                                            >
                                                Continue Learning
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 glass-card rounded-3xl border-dashed relative z-10">
                        <div className="w-20 h-20 bg-[#D97757]/10 border border-[#D97757]/20 text-[#D97757] rounded-full flex items-center justify-center mx-auto mb-6">
                            <GraduationCap size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md mb-3">
                            No courses yet
                        </h3>
                        <p className="text-slate-500 dark:text-white/60 mb-8 max-w-md mx-auto text-lg">
                            {searchTerm
                                ? 'No enrolled courses match your search.'
                                : "You haven't enrolled in any courses yet. Start your journey today!"}
                        </p>
                        {!searchTerm && (
                            <Button
                                variant="gradient"
                                size="lg"
                                onClick={() => navigate('/enrollments')}
                            >
                                Browse Catalog
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default MyCourses;
