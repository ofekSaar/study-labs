import React, { useEffect, useState } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import useEnrollmentStore from '../store/enrollmentStore';
import useCourseStore from '../store/courseStore';
import { Check, X, Clock, AlertCircle } from 'lucide-react';

const EnrollmentRequests = () => {
    const { courses, fetchAllCourses } = useCourseStore();
    const { courseEnrollments, fetchCourseEnrollments, approveEnrollment, denyEnrollment, isLoading } = useEnrollmentStore();
    
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [isActioning, setIsActioning] = useState(false);

    // Initial load of courses
    useEffect(() => {
        fetchAllCourses();
    }, [fetchAllCourses]);

    // Select first course by default when courses load
    useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses, selectedCourseId]);

    // Fetch enrollments when course or filter changes
    useEffect(() => {
        if (selectedCourseId) {
            fetchCourseEnrollments(selectedCourseId, statusFilter === 'all' ? '' : statusFilter);
        }
    }, [selectedCourseId, statusFilter, fetchCourseEnrollments]);

    const handleApprove = async (id) => {
        setIsActioning(true);
        try {
            await approveEnrollment(id);
        } catch (error) {
            alert(error.message || "Failed to approve enrollment");
        } finally {
            setIsActioning(false);
        }
    };

    const handleDeny = async (id) => {
        setIsActioning(true);
        try {
            await denyEnrollment(id);
        } catch (error) {
            alert(error.message || "Failed to deny enrollment");
        } finally {
            setIsActioning(false);
        }
    };

    return (
        <InstructorLayout title="Enrollment Requests">
            <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto pb-32 space-y-8">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Enrollments</h1>
                        <p className="text-gray-500">Manage student access requests to your courses.</p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <select 
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-purple-500 focus:border-purple-500 block w-full sm:w-64 p-2.5 shadow-sm"
                        >
                            <option value="" disabled>Select a course...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                        
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center self-start whitespace-nowrap">
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'pending' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                All History
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : courseEnrollments.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No requests found</h3>
                            <p className="text-gray-500">There are no {statusFilter === 'pending' ? 'pending' : ''} enrollment requests for this course.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-medium uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Requested On</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {courseEnrollments.map((req) => (
                                        <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={req.student?.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-10 h-10 rounded-full bg-gray-200 border border-gray-200" />
                                                    <div>
                                                        <div className="font-bold text-gray-900">{req.student?.name}</div>
                                                        <div className="text-gray-500 text-xs">{req.student?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-gray-400" />
                                                    {new Date(req.requestedAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Pending</span>}
                                                {req.status === 'approved' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Approved</span>}
                                                {req.status === 'denied' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Denied</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {req.status === 'pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleDeny(req._id)}
                                                            disabled={isActioning}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Deny"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleApprove(req._id)}
                                                            disabled={isActioning}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            <Check size={20} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                                                        Resolved
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </InstructorLayout>
    );
};

export default EnrollmentRequests;
