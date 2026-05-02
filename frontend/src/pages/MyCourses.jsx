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
            <div className="max-w-6xl mx-auto px-6 py-8 pb-32 animate-fade-in">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900">My Courses</h1>
                        <p className="text-gray-500 mt-1">Pick up where you left off in your learning journey.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search my courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-studylabs-blue focus:outline-none transition bg-white"
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
                                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${course.color || 'bg-blue-100 text-blue-600'}`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Progress</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-studylabs-blue rounded-full" 
                                                    style={{ width: `${course.progress || 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-900">{Math.round(course.progress || 0)}%</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <h3 className="font-display font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                                    {course.title || 'Untitled Course'}
                                </h3>
                                <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-1">
                                    {course.description || 'No description provided.'}
                                </p>
                                
                                <div className="mt-auto">
                                    <div className="flex items-center gap-2 mb-4">
                                        <img 
                                            src={course.instructor?.avatar || 'https://via.placeholder.com/150'} 
                                            alt={course.instructor?.name} 
                                            className="w-6 h-6 rounded-full bg-gray-100"
                                        />
                                        <span className="text-xs text-gray-500 font-medium">by {course.instructor?.name || 'Instructor'}</span>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/course/${course.id}`)}
                                        className="w-full bg-studylabs-blue text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 group-hover:bg-studylabs-dark transition"
                                    >
                                        <Play size={16} fill="currentColor" />
                                        Continue Learning
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GraduationCap size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No courses yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            {searchTerm ? 'No enrolled courses match your search.' : 'You haven\'t enrolled in any courses yet. Start your journey today!'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => navigate('/enrollments')}
                                className="bg-studylabs-blue text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-studylabs-dark transition"
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
