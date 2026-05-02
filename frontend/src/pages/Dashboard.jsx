import React, { useEffect } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import XPHeader from '../components/dashboard/XPHeader';
import RoadmapView from '../components/dashboard/RoadmapView';
import NodeDrawer from '../components/dashboard/NodeDrawer';
import useCourseStore from '../store/courseStore';

const Dashboard = () => {
    const { courses, fetchCourses, fetchStats, isLoading } = useCourseStore();

    useEffect(() => {
        fetchStats();
        fetchCourses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (isLoading && courses.length === 0) {
        return (
            <StudentLayout title="Learning Map">
                <div className="flex justify-center p-20">
                    <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
                </div>
            </StudentLayout>
        );
    }
    return (
        <StudentLayout title="Learning Map">
            {/* The XP Header floats at the top of the content area */}
            <XPHeader />

            {/* background decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #4F46E5 0%, transparent 20%), radial-gradient(circle at 80% 80%, #10B981 0%, transparent 20%)' }}>
            </div>

            <div className="relative z-[1]">
                <RoadmapView />
            </div>

            {/* Mount drawer outside context so it overlaps XPHeader correctly */}
            <NodeDrawer />
        </StudentLayout>
    );
};

export default Dashboard;
