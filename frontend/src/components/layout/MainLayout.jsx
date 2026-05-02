import React, { useState } from 'react';
import { Home, Settings, LogOut, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import CourseSidebarItem from '../dashboard/CourseSidebarItem';

const MainLayout = ({ children, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { courses, selectedCourseId, setSelectedCourse } = useCourseStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200 sticky top-0 h-screen z-30">
                {/* Logo Area */}
                <div className="p-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-studylabs-blue rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                            S
                        </div>
                        <span className="font-display font-bold text-xl text-studylabs-dark">StudyLabs</span>
                    </div>
                </div>

                {/* Course Navigator - Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                    <div className="mb-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">My Courses</div>

                    <div className="space-y-2">
                        {courses.map(course => (
                            <CourseSidebarItem
                                key={course.id}
                                course={course}
                                isSelected={selectedCourseId === course.id}
                                onClick={() => {
                                    setSelectedCourse(course.id);
                                    if (location.pathname !== '/') navigate('/');
                                }}
                            />
                        ))}
                    </div>

                    <div className="mt-8 mb-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu</div>
                    <button
                        onClick={() => navigate('/instructor')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                        <Home size={20} />
                        <span className="font-medium text-sm">Instructor View</span>
                    </button>
                </div>

                {/* Quick Actions Footer */}
                <div className="p-4 pb-10 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col gap-1">
                        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-all text-sm font-medium">
                            <Settings size={18} />
                            <span>Settings</span>
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-all text-sm font-medium">
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Mobile Header */}
                <header className="md:hidden px-6 py-4 flex items-center justify-between bg-white sticky top-0 z-20 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-studylabs-blue rounded-lg flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="font-display font-bold text-lg text-studylabs-dark">StudyLabs</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-full">
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>
                </header>

                {/* Content */}
                <main className="flex-1 relative">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav can be removed or adapted. For now, removing to focus on the 'Game Map' feel which usually doesn't have a bottom tab bar on desktop web apps, but keeping responsive considerations in mind. */}
        </div>
    );
};

export default MainLayout;
