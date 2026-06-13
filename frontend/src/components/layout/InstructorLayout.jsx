import React, { useState } from 'react';
import { Home, Settings, LogOut, Menu, PlusCircle, BookOpen, ChevronRight, X, Users, Flame, Zap, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useCourseStore from '../../store/courseStore';
import SettingsModal from './SettingsModal';
import useGamificationStore, { INSTRUCTOR_AVATARS } from '../../store/gamificationStore';

/* ── Logo SVG ── */
const Logo = ({ size = 32 }) => (
    <div className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
            width: size, height: size,
            background: 'linear-gradient(135deg, #7C3AED, #4F6EF7)',
            boxShadow: '0 0 16px rgba(124,58,237,0.5)',
        }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

/* ── Nav Item ── */
const NavItem = ({ icon, label, active, onClick }) => {
    return (
        <button onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                active 
                    ? 'text-purple-600 dark:text-white bg-purple-600/10 dark:bg-purple-500/20 border border-purple-500/20 dark:border-purple-500/40' 
                    : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
        >
            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-purple-600 dark:bg-purple-400" />}
            <span className={`transition-colors ${active ? 'text-purple-600 dark:text-purple-300' : 'text-slate-400 dark:text-white/40 group-hover:text-slate-700 dark:group-hover:text-white/70'}`}>{icon}</span>
            <span>{label}</span>
            {active && <ChevronRight size={14} className="ml-auto text-purple-600 dark:text-purple-400" />}
        </button>
    );
};

const SidebarContent = ({ location, navigate, user, courseUser, _setIsSidebarOpen, setIsSettingsOpen, handleLogout }) => {
    const { activeAvatar } = useGamificationStore();
    const currentAvatar = INSTRUCTOR_AVATARS.find(a => a.id === activeAvatar) || INSTRUCTOR_AVATARS[0];

    return (
        <div className="flex flex-col h-full">
            {/* ── Logo ── */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3">
                    <Logo size={36} />
                    <div>
                        <span className="font-display font-bold text-lg text-slate-800 dark:text-white leading-none block">StudyLabs</span>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mt-0.5">Instructor</span>
                    </div>
                </div>
            </div>

            {/* ── Nav ── */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 dark:text-white/25 uppercase tracking-widest">Menu</div>

                <NavItem icon={<Home size={18} />} label="Dashboard"
                    active={location.pathname === '/instructor'}
                    onClick={() => navigate('/instructor')} accent="purple" />

                <NavItem icon={<TrendingUp size={18} />} label="Student Status"
                    active={location.pathname === '/instructor/status'}
                    onClick={() => navigate('/instructor/status')} accent="purple" />

                <NavItem icon={<PlusCircle size={18} />} label="Create Course"
                    active={location.pathname === '/instructor/create'}
                    onClick={() => navigate('/instructor/create')} accent="purple" />

                <NavItem icon={<Users size={18} />} label="Enrollment Requests"
                    active={location.pathname === '/instructor/enrollments'}
                    onClick={() => navigate('/instructor/enrollments')} accent="purple" />

                <NavItem icon={<BookOpen size={18} />} label="Managed Courses"
                    active={location.pathname.includes('/instructor/managed')}
                    onClick={() => navigate('/instructor/managed')} accent="purple" />
            </div>

            {/* ── Footer ── */}
            <div className="p-4 border-t border-slate-200 dark:border-white/8">
                {/* User */}
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-default">
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-sm transition-transform duration-300 select-none">
                            {currentAvatar.emoji}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-200 dark:border-slate-900" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">{user?.name || 'Instructor'}</p>
                        
                        {/* Gamification Stats */}
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Level">
                                <Trophy size={12} className="fill-emerald-500/15" />
                                <span className="text-[10px] font-bold">Lvl {courseUser?.totalXP ? Math.floor(courseUser.totalXP / 100) + 1 : 1}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400" title="Total XP">
                                <Zap size={12} className="fill-purple-500/15" />
                                <span className="text-[10px] font-bold">{courseUser?.totalXP || 0}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400" title="Day Streak">
                                <Flame size={12} className="fill-orange-500/15" />
                                <span className="text-[10px] font-bold">{courseUser?.streak || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-0.5">
                    {user?.roles?.includes('student') && (
                        <button onClick={() => navigate('/')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 hover:text-indigo-700 dark:hover:text-indigo-200 transition-all">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Switch to Student
                        </button>
                    )}
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white/70 transition-all"
                    >
                        <Settings size={16} />Settings
                    </button>
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500/70 dark:text-red-400/70 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all">
                        <LogOut size={16} />Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

const InstructorLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuthStore();
    const { user: courseUser } = useCourseStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };

    const sidebarProps = { location, navigate, user, courseUser, setIsSidebarOpen, setIsSettingsOpen, handleLogout };

    return (
        <div className="min-h-screen flex font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-72 sticky top-0 h-screen z-30 sidebar-theme">
                <SidebarContent {...sidebarProps} />
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-72 sidebar-theme shadow-2xl">
                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => setIsSidebarOpen(false)}
                                className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <SidebarContent {...sidebarProps} />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Mobile header */}
                <header className="md:hidden px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-20 glass-card border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                        <Logo size={32} />
                        <span className="font-display font-bold text-lg text-slate-800 dark:text-white">StudyLabs</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/80 transition-colors">
                        <Menu size={22} />
                    </button>
                </header>

                <main className="flex-1 relative page-enter">
                    {children}
                </main>
            </div>
            
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} isInstructor={true} />
        </div>
    );
};

export default InstructorLayout;
