import React, { useState } from 'react';
import { Home, Settings, LogOut, Menu, PlusCircle, BookOpen } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useCourseStore from '../../store/courseStore';

const InstructorLayout = ({ children, title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuthStore();
    const { courses } = useCourseStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-200 sticky top-0 h-screen z-30">
                {/* Logo Area */}
                <div className="p-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-purple-200">
                            I
                        </div>
                        <span className="font-display font-bold text-xl text-gray-900">StudyLabs <span className="text-purple-600 font-medium text-sm">Instructor</span></span>
                    </div>
                </div>

                {/* Navigator - Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
                    <div className="mb-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Menu</div>
                    
                    <button
                        onClick={() => navigate('/instructor')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/instructor' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                    >
                        <Home size={20} />
                        <span className="text-sm">Dashboard</span>
                    </button>

                    <button
                        onClick={() => navigate('/instructor/create')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/instructor/create' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                    >
                        <PlusCircle size={20} />
                        <span className="text-sm">Create Course</span>
                    </button>

                    <button
                        onClick={() => navigate('/instructor/enrollments')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname === '/instructor/enrollments' ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                    >
                        <BookOpen size={20} />
                        <span className="text-sm">Enrollment Requests</span>
                    </button>

                    <div className="mt-8 mb-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Managed Courses</div>
                    
                    <div className="space-y-1">
                        {courses.map(course => (
                            <button
                                key={course.id}
                                onClick={() => navigate(`/instructor/course/${course.id}`)}
                                className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${location.pathname === `/instructor/course/${course.id}` ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <BookOpen size={16} className={location.pathname === `/instructor/course/${course.id}` ? 'text-purple-600' : 'text-gray-400'} />
                                <span className="text-sm truncate">{course.title}</span>
                            </button>
                        ))}
                    </div>

                </div>

                {/* Quick Actions Footer */}
                <div className="p-4 pb-10 border-t border-gray-100 bg-gray-50/50">
                    <div className="px-4 py-3 mb-2 flex items-center gap-3">
                        <img src={user?.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-gray-200" />
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
                            <p className="text-xs text-gray-500">Instructor</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-all text-sm font-medium">
                            <Settings size={18} />
                            <span>Settings</span>
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-all text-sm font-medium">
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
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            I
                        </div>
                        <span className="font-display font-bold text-lg text-gray-900">StudyLabs</span>
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
        </div>
    );
};

export default InstructorLayout;
