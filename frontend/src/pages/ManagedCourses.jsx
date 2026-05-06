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
            <div className="max-w-6xl mx-auto px-6 py-8 pb-32 animate-fade-in">
                
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900">Managed Courses</h1>
                        <p className="text-gray-500 mt-1">View, search, and manage all your created courses.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search courses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-studylabs-blue focus:outline-none transition bg-white"
                            />
                        </div>
                        <button
                            onClick={() => navigate('/instructor/create')}
                            className="bg-studylabs-blue text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-studylabs-dark transition whitespace-nowrap"
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
                                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${course.color || 'bg-blue-100 text-blue-600'}`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                                        course.generationStatus === 'generating' ? 'bg-studylabs-blue/10 text-studylabs-blue' :
                                        course.generationStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                        course.isPublished ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                        {course.generationStatus === 'generating' && <Loader2 size={12} className="animate-spin" />}
                                        {course.generationStatus === 'failed' && <AlertCircle size={12} />}
                                        {course.generationStatus === 'generating' ? 'Generating AI' :
                                         course.generationStatus === 'failed' ? 'Failed' :
                                         course.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                                
                                <h3 className="font-display font-bold text-xl text-gray-900 mb-2 line-clamp-2">
                                    {course.title || 'Untitled Course'}
                                </h3>
                                <p className="text-gray-500 text-sm mb-6 line-clamp-3 flex-1">
                                    {course.description || 'No description provided.'}
                                </p>
                                
                                <div className="mt-auto">
                                    <hr className="border-gray-100 mb-4" />
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                                <Users size={14} />
                                                <span>{course.level || 'Beginner'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                                <Clock size={14} />
                                                <span className="uppercase">{course.department || 'Other'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDelete(course.id, course.title)}
                                                disabled={deletingId === course.id}
                                                className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-full flex items-center justify-center transition disabled:opacity-50"
                                                title="Delete course"
                                            >
                                                {deletingId === course.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => navigate(`/instructor/course/${course.id}`)}
                                                className="w-8 h-8 bg-gray-50 hover:bg-studylabs-blue hover:text-white text-gray-400 rounded-full flex items-center justify-center transition"
                                                title="View course"
                                            >
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No courses found</h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm ? 'Try adjusting your search filters.' : 'You haven\'t created any courses yet.'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => navigate('/instructor/create')}
                                className="bg-studylabs-blue text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-studylabs-dark transition"
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
