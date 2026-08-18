import React, { useEffect, useState } from 'react';
import useEnrollmentStore from '../store/enrollmentStore';
import useToastStore from '../store/toastStore';
import api from '../utils/api';
import { Search } from 'lucide-react';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import AvatarDisplay from '../components/instructor/AvatarDisplay';
import logger from '../utils/logger';

// Values must match the Course model's `department` enum — courses store slugs, not labels.
const DEPARTMENTS = [
    { value: 'all', label: 'All' },
    { value: 'cs', label: 'Computer Science' },
    { value: 'math', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'bio', label: 'Biology' },
    { value: 'other', label: 'Other' },
];

const getDeptGradient = (dept) => {
    const d = dept?.toLowerCase() || '';
    if (d.includes('computer') || d.includes('cs') || d.includes('software'))
        return 'from-purple-600 to-indigo-600';
    if (d.includes('math')) return 'from-blue-500 to-cyan-500';
    if (
        d.includes('science') ||
        d.includes('bio') ||
        d.includes('chemistry') ||
        d.includes('physics')
    )
        return 'from-emerald-500 to-teal-500';
    if (d.includes('business') || d.includes('economics') || d.includes('marketing'))
        return 'from-amber-500 to-orange-500';
    return 'from-[#D97757] to-[#C4613D]';
};

const MyEnrollments = () => {
    const { myEnrollments, fetchMyEnrollments, requestEnrollment } = useEnrollmentStore();
    const [availableCourses, setAvailableCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [requestingId, setRequestingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDept, setActiveDept] = useState('all');

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setLoadError(false);
            await fetchMyEnrollments();
            try {
                const { data } = await api.get('/api/courses');
                setAvailableCourses(data.courses || []);
            } catch (error) {
                logger.error('Failed to fetch courses', error);
                setLoadError(true);
                useToastStore
                    .getState()
                    .error('Failed to load courses', 'Please refresh the page to try again.');
            }
            setIsLoading(false);
        };
        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRequest = async (courseId) => {
        setRequestingId(courseId);
        try {
            await requestEnrollment(courseId);
            await fetchMyEnrollments();
            useToastStore
                .getState()
                .success('Request sent', 'Your enrollment request has been submitted.');
        } catch (error) {
            useToastStore
                .getState()
                .error('Request failed', error.message || 'Failed to request enrollment');
        } finally {
            setRequestingId(null);
        }
    };

    const filteredCourses = availableCourses.filter((course) => {
        const matchesSearch =
            course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = activeDept === 'all' || course.department === activeDept;
        return matchesSearch && matchesDept;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wide">
                        Approved
                    </span>
                );
            case 'pending':
                return (
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold uppercase tracking-wide">
                        Pending
                    </span>
                );
            case 'denied':
                return (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wide">
                        Denied
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div
                    className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(217,119,87,0.12) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute top-1/2 -right-32 w-80 h-80 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-[1] p-4 sm:p-6 max-w-[1600px] mx-auto pb-32">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight drop-shadow-sm dark:drop-shadow-md">
                        Discover Courses
                    </h1>
                    <p className="text-slate-500 dark:text-white/60 text-lg font-medium">
                        Browse available courses and request enrollment.
                    </p>
                </div>

                {/* Search + Filter Row */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#D97757] focus:bg-white dark:focus:bg-white/10 focus:outline-none transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {DEPARTMENTS.map((dept) => (
                            <button
                                key={dept.value}
                                onClick={() => setActiveDept(dept.value)}
                                aria-pressed={activeDept === dept.value}
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                                    activeDept === dept.value
                                        ? 'bg-[#D97757] text-white border-[#D97757] shadow-[0_0_12px_rgba(217,119,87,0.35)]'
                                        : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10 hover:border-[#D97757]/40 hover:text-[#D97757]'
                                }`}
                            >
                                {dept.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loadError && !isLoading && (
                    <div className="mb-6 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                        Couldn't load the full course list. Some courses may be missing — try
                        refreshing the page.
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-12" role="status" aria-live="polite">
                        <Spinner label="Loading courses" />
                        <span className="sr-only">Loading courses…</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => {
                            const enrollment = myEnrollments.find(
                                (e) => (e.course._id || e.course) === course._id
                            );
                            const gradient = getDeptGradient(course.department);

                            return (
                                <div
                                    key={course._id}
                                    className="glass-card rounded-3xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full group relative"
                                >
                                    {/* Inner glow hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#D97757]/8 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    {/* Course header banner */}
                                    <div
                                        className={`h-36 bg-gradient-to-br ${course.color || gradient} relative overflow-hidden`}
                                    >
                                        {/* Subtle pattern overlay */}
                                        <div
                                            className="absolute inset-0 opacity-20"
                                            style={{
                                                backgroundImage:
                                                    'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-5">
                                            <span className="px-3 py-1.5 bg-white/15 backdrop-blur-md text-white text-[10px] font-black tracking-widest rounded-full border border-white/25 shadow-inner uppercase">
                                                {DEPARTMENTS.find(
                                                    (d) => d.value === course.department
                                                )?.label || 'General'}
                                            </span>
                                        </div>
                                        <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-xl">
                                            {course.courseAvatar || '📚'}
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col relative z-10">
                                        <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-2 drop-shadow-sm dark:drop-shadow-md group-hover:text-[#D97757] dark:group-hover:text-[#D97757] transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-slate-500 dark:text-white/60 text-sm mb-5 line-clamp-3 flex-1">
                                            {course.description}
                                        </p>

                                        <div className="flex items-center gap-3 mb-5 bg-slate-100 dark:bg-black/20 p-3 rounded-2xl border border-slate-200/50 dark:border-white/5">
                                            <AvatarDisplay
                                                photoUrl={course.instructor?.photoUrl}
                                                avatar={course.instructor?.avatar}
                                                name={course.instructor?.name}
                                                size="w-10 h-10"
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

                                        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                                            <div>
                                                {enrollment ? (
                                                    getStatusBadge(enrollment.status)
                                                ) : (
                                                    <span className="text-slate-400 dark:text-white/40 text-sm font-bold tracking-wide uppercase">
                                                        Not enrolled
                                                    </span>
                                                )}
                                            </div>
                                            {(!enrollment || enrollment.status === 'denied') && (
                                                <Button
                                                    variant="gradient"
                                                    size="sm"
                                                    onClick={() => handleRequest(course._id)}
                                                    loading={requestingId === course._id}
                                                    disabled={
                                                        requestingId !== null &&
                                                        requestingId !== course._id
                                                    }
                                                    aria-label={
                                                        enrollment?.status === 'denied'
                                                            ? `Request access again for ${course.title}`
                                                            : `Request access for ${course.title}`
                                                    }
                                                >
                                                    {enrollment?.status === 'denied'
                                                        ? 'Request Again'
                                                        : 'Request Access'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredCourses.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                                <div className="w-24 h-24 mb-6 rounded-full bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center">
                                    <span className="text-4xl opacity-60">🛸</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                    No Courses Found
                                </h3>
                                <p className="text-slate-500 dark:text-white/40 max-w-md">
                                    {searchTerm || activeDept !== 'all'
                                        ? 'Try adjusting your search or filters.'
                                        : 'There are currently no published courses available. Check back later!'}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default MyEnrollments;
