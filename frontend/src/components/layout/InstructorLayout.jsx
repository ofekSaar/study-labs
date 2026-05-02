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

                    <button
                        onClick={() => navigate('/instructor/managed')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${location.pathname.includes('/instructor/managed') ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                    >
                        <BookOpen size={20} />
                        <span className="text-sm">Managed Courses</span>
                    </button>

                </div>

                {/* Quick Actions Footer */}
                <div className="p-4 pb-10 border-t border-gray-100 bg-gray-50/50">
                    <div className="px-4 py-3 mb-2 flex items-center gap-3">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm"
                            style={{ display: user?.avatar ? 'none' : 'flex' }}
                        >
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
                            <p className="text-xs text-gray-500">Instructor</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        {/* Show "Switch to Student" if user has both roles */}
                        {user?.roles?.includes('student') && (
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-studylabs-blue hover:bg-blue-50 transition-all text-sm font-medium"
                            >
                                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span>Switch to Student</span>
                            </button>
                        )}
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
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50 relative">
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
