import React, { useEffect, useState } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import ClassProgressChart from '../components/analytics/ClassProgressChart';
import { Users, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../store/courseStore';
import api from '../utils/api';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const { courses, fetchAllCourses } = useCourseStore();
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAllCourses();
    }, [fetchAllCourses]);

    useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses, selectedCourseId]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!selectedCourseId) return;
            setIsLoading(true);
            try {
                const { data } = await api.get(`/api/courses/${selectedCourseId}/analytics`);
                setAnalytics(data);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, [selectedCourseId]);

    const metrics = analytics?.metrics || {
        totalStudents: 0,
        averageCompletion: 0,
        activeNodes: 0,
        totalClassXP: 0
    };

    const atRisk = analytics?.atRiskStudents || [];

    return (
        <InstructorLayout title="Instructor Overview">
            <div className="space-y-8 p-6 md:p-8 pb-32">

                {/* Actions Bar */}
                <div className="flex justify-end">
                    <button
                        className="bg-studylabs-blue text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-studylabs-dark transition flex items-center gap-2"
                        onClick={() => navigate('/instructor/create')}
                    >
                        + New Course
                    </button>
                </div>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Total Students"
                        value={metrics.totalStudents}
                        icon={<Users size={20} className="text-blue-600" />}
                        color="bg-blue-50"
                    />
                    <MetricCard
                        label="Avg. Completion"
                        value={`${Math.round(metrics.averageCompletion)}%`}
                        icon={<TrendingUp size={20} className="text-green-600" />}
                        color="bg-green-50"
                    />
                    <MetricCard
                        label="Active Modules"
                        value={metrics.activeNodes}
                        icon={<BookOpen size={20} className="text-purple-600" />}
                        color="bg-purple-50"
                    />
                    <MetricCard
                        label="Class XP"
                        value={metrics.totalClassXP}
                        icon={<Trophy size={20} className="text-orange-600" />}
                        color="bg-orange-50"
                    />
                </div>

                {/* content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Chart Section */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-display font-bold text-lg text-gray-900">Class Progress</h3>
                            <select 
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-gray-600"
                            >
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                        <ClassProgressChart />
                        <div className="mt-4 text-center text-sm text-gray-400">
                            Distribution of students across modules
                        </div>
                    </div>

                    {/* Side Panel - At Risk */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                        <h3 className="font-display font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                            At-Risk Students
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{atRisk.length}</span>
                        </h3>
                        <div className="flex-1 space-y-4">
                            {atRisk.map((student, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition">
                                    <img src={student.avatar || 'https://via.placeholder.com/150'} alt="Avatar" className="w-10 h-10 rounded-full bg-gray-200" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
                                        <p className="text-xs text-red-500 font-medium">{student.reason}</p>
                                    </div>
                                    <button className="text-xs font-bold text-studylabs-blue hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                                        Message
                                    </button>
                                </div>
                            ))}
                            {atRisk.length === 0 && !isLoading && (
                                <div className="text-center text-gray-500 py-10">No students are currently at risk.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </InstructorLayout>
    );
};

// Simple internal component for metrics
const MetricCard = ({ label, value, change, icon, color }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
            <div className={`p-2 rounded-xl ${color}`}>
                {icon}
            </div>
            {change && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {change}
                </span>
            )}
        </div>
        <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

export default InstructorDashboard;
