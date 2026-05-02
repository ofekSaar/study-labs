import React, { useEffect, useState } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import useEnrollmentStore from '../store/enrollmentStore';
import api from '../utils/api';

const MyEnrollments = () => {
    const { myEnrollments, fetchMyEnrollments, requestEnrollment } = useEnrollmentStore();
    const [availableCourses, setAvailableCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await fetchMyEnrollments();
            try {
                // Fetch all published courses
                const { data } = await api.get('/api/courses');
                setAvailableCourses(data.courses || []);
            } catch (error) {
                console.error("Failed to fetch courses", error);
            }
            setIsLoading(false);
        };
        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRequest = async (courseId) => {
        setIsRequesting(true);
        try {
            await requestEnrollment(courseId);
            // Refresh to update status locally
            await fetchMyEnrollments();
        } catch (error) {
            alert(error.message || "Failed to request enrollment");
        } finally {
            setIsRequesting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">Approved</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase tracking-wide">Pending</span>;
            case 'denied':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase tracking-wide">Denied</span>;
            default:
                return null;
        }
    };

    return (
        <StudentLayout title="Find Courses">
            <div className="p-6 max-w-6xl mx-auto pb-32">
                <div className="mb-10">
                    <h1 className="font-display text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Discover Courses</h1>
                    <p className="text-gray-500 text-lg">Browse available courses and request enrollment.</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableCourses.map((course) => {
                            // Find if there's an existing enrollment request for this course
                            const enrollment = myEnrollments.find(e => e.course._id === course._id || e.course === course._id);
                            
                            return (
                                <div key={course._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden h-full">
                                    <div className={`h-32 ${course.color || 'bg-studylabs-blue'} relative`}>
                                        <div className="absolute inset-0 bg-black/10"></div>
                                        <div className="absolute bottom-4 left-6">
                                            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">
                                                {course.department.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="font-display font-bold text-xl text-gray-900 mb-2">{course.title}</h3>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">{course.description}</p>
                                        
                                        <div className="flex items-center gap-3 mb-6">
                                            <img src={course.instructor?.avatar || 'https://via.placeholder.com/150'} alt="Instructor" className="w-8 h-8 rounded-full bg-gray-200" />
                                            <div className="text-sm">
                                                <p className="text-gray-900 font-medium">{course.instructor?.name || 'Instructor'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <div>
                                                {enrollment ? getStatusBadge(enrollment.status) : <span className="text-gray-400 text-sm font-medium">Not enrolled</span>}
                                            </div>
                                            
                                            {(!enrollment || enrollment.status === 'denied') && (
                                                <button
                                                    onClick={() => handleRequest(course._id)}
                                                    disabled={isRequesting}
                                                    className="bg-studylabs-blue text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:bg-studylabs-dark transition disabled:opacity-50"
                                                >
                                                    {enrollment?.status === 'denied' ? 'Request Again' : 'Request Access'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {availableCourses.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500">
                                No published courses available right now.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default MyEnrollments;
