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
                return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wide drop-shadow-md">Approved</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold uppercase tracking-wide drop-shadow-md">Pending</span>;
            case 'denied':
                return <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wide drop-shadow-md">Denied</span>;
            default:
                return null;
        }
    };

    return (
        <StudentLayout title="Find Courses">
            {/* Ambient background orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] p-4 sm:p-6 max-w-[1600px] mx-auto pb-32">
                <div className="mb-10">
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight drop-shadow-sm dark:drop-shadow-md">Discover Courses</h1>
                    <p className="text-slate-500 dark:text-white/60 text-lg font-medium">Browse available courses and request enrollment.</p>
                </div>
 
                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableCourses.map((course) => {
                            // Find if there's an existing enrollment request for this course
                            const enrollment = myEnrollments.find(e => e.course._id === course._id || e.course === course._id);
                            
                            return (
                                <div key={course._id} className="glass-card rounded-3xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full group relative">
                                    {/* Inner glow hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    
                                    <div className={`h-36 ${course.color || 'bg-indigo-600'} relative`}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <div className="absolute bottom-4 left-6">
                                            <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black tracking-widest rounded-full border border-white/20 shadow-inner uppercase">
                                                {course.department?.toUpperCase() || 'GENERAL'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 flex flex-col relative z-10">
                                        <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2 drop-shadow-sm dark:drop-shadow-md">{course.title}</h3>
                                        <p className="text-slate-500 dark:text-white/60 text-sm mb-6 line-clamp-3 flex-1">{course.description}</p>
                                        
                                        <div className="flex items-center gap-3 mb-6 bg-slate-100 dark:bg-black/20 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                            <img src={course.instructor?.avatar || 'https://via.placeholder.com/150'} alt="Instructor" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20" />
                                            <div className="text-sm">
                                                <p className="text-slate-800 dark:text-white font-bold">{course.instructor?.name || 'Instructor'}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-white/40 uppercase tracking-widest mt-0.5">Course Creator</p>
                                            </div>
                                        </div>
 
                                        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                                            <div>
                                                {enrollment ? getStatusBadge(enrollment.status) : <span className="text-slate-400 dark:text-white/40 text-sm font-bold tracking-wide uppercase">Not enrolled</span>}
                                            </div>
                                            
                                            {(!enrollment || enrollment.status === 'denied') && (
                                                <button
                                                    onClick={() => handleRequest(course._id)}
                                                    disabled={isRequesting}
                                                    className="bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-indigo-400 transition-colors disabled:opacity-50"
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
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 mb-6 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                                    <span className="text-4xl opacity-50">🛸</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Courses Found</h3>
                                <p className="text-slate-500 dark:text-white/40 max-w-md">There are currently no published courses available in the catalog. Check back later!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default MyEnrollments;
