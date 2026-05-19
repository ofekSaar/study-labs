import React, { useEffect } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import { Users, BookOpen, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../store/courseStore';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const { courses, fetchAllCourses, isLoading } = useCourseStore();

    useEffect(() => {
        fetchAllCourses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const totalStudents = courses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

    return (
        <InstructorLayout title="Instructor Dashboard">
            {/* Ambient background orbs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(79,110,247,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] space-y-8 p-6 md:p-8 pb-32 max-w-[1200px] mx-auto">

                {/* Actions Bar */}
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">Instructor Dashboard</h1>
                    <p className="text-slate-500 dark:text-white/60 text-lg mt-1 font-medium">Manage your courses, view general stats, and create new programs.</p>
                </div>

                {/* Dashboard Metrics and Action Cards */}
                {isLoading ? (
                    <div className="h-64 w-full flex items-center justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl">
                        <MetricCard
                            label="Total Courses"
                            value={courses.length}
                            icon={<BookOpen size={24} className="text-purple-600 dark:text-purple-400 drop-shadow-sm dark:drop-shadow-md" />}
                            glowColor="rgba(124,58,237,0.5)"
                        />
                        <MetricCard
                            label="Total Students"
                            value={totalStudents}
                            icon={<Users size={24} className="text-indigo-600 dark:text-indigo-400 drop-shadow-sm dark:drop-shadow-md" />}
                            glowColor="rgba(99,102,241,0.5)"
                        />
                        <CreateCourseCard onClick={() => navigate('/instructor/create')} />
                    </div>
                )}
            </div>
        </InstructorLayout>
    );
};

const MetricCard = ({ label, value, icon, glowColor }) => (
    <div
        className="p-5 rounded-3xl flex flex-col justify-between h-36 cursor-default transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_16px_32px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.5)] bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 relative overflow-hidden group text-right"
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}
    >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }} />
        <div className="flex justify-between items-start relative z-10 w-full">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-inner">
                {icon}
            </div>
        </div>
        <div className="relative z-10">
            <p className="text-slate-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
            <p className="text-3xl font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md">{value}</p>
        </div>
    </div>
);

const CreateCourseCard = ({ onClick }) => (
    <button
        onClick={onClick}
        className="p-5 rounded-3xl flex flex-col justify-between h-36 text-right transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_16px_32px_rgba(124,58,237,0.25)] bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-500/30 text-white relative overflow-hidden group shadow-md"
    >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="flex justify-between items-start relative z-10 w-full">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20 shadow-inner text-white">
                <PlusCircle size={24} />
            </div>
        </div>
        <div className="relative z-10">
            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Create</p>
            <p className="text-2xl font-black text-white drop-shadow-md">New Course</p>
        </div>
    </button>
);

export default InstructorDashboard;
