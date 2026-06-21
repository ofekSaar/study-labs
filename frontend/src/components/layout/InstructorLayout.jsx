import React, { useState } from 'react';
import { Home, Settings, LogOut, Menu, PlusCircle, BookOpen, ChevronRight, X, Users, Flame, Zap, Trophy, TrendingUp, GraduationCap, BarChart2 } from 'lucide-react';
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
            background: 'linear-gradient(135deg, #7C3AED, #D97757)',
            boxShadow: '0 0 16px rgba(124,58,237,0.5)',
        }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

/* ── Purple Game Nav Item ── */
const GameNavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative group overflow-hidden ${
            active
                ? 'text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-500/15 to-violet-500/5 dark:from-purple-500/20 dark:to-violet-500/8 border border-purple-500/30 dark:border-purple-500/40 shadow-sm'
                : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white/90 hover:bg-purple-500/5 dark:hover:bg-white/5 border border-transparent'
        }`}
        style={active ? { boxShadow: '-3px 0 12px rgba(124,58,237,0.2), inset 0 0 20px rgba(124,58,237,0.04)' } : {}}
    >
        {/* Active left glow bar */}
        {active && (
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-purple-400 to-violet-500"
                style={{ boxShadow: '3px 0 10px rgba(124,58,237,0.8)' }}
            />
        )}

        {/* Hover shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

        <span
            className={`transition-all duration-200 relative ${
                active
                    ? 'text-purple-500 dark:text-purple-400'
                    : 'text-slate-400 dark:text-white/35 group-hover:text-purple-400 dark:group-hover:text-purple-400/70'
            }`}
            style={active ? { filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.7))' } : {}}
        >
            {icon}
        </span>

        <span className="relative flex-1 text-left">{label}</span>
        {active && <ChevronRight size={12} className="ml-auto text-purple-500/70 relative shrink-0" />}
    </button>
);

const SidebarContent = ({ location, navigate, user, courseUser, setIsSidebarOpen, setIsSettingsOpen, handleLogout }) => {
    const { activeAvatar } = useGamificationStore();
    const currentAvatar = INSTRUCTOR_AVATARS.find(a => a.id === activeAvatar) || INSTRUCTOR_AVATARS[0];

    return (
        <div className="flex flex-col h-full">

            {/* ── Logo ── */}
            <div className="p-5 pb-4">
                <div className="flex items-center gap-3">
                    <Logo size={36} />
                    <div>
                        <span className="font-display font-bold text-xl text-slate-800 dark:text-white leading-none block tracking-tight">StudyLabs</span>
                        <span
                            className="text-[9px] font-black uppercase tracking-widest mt-0.5 block"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #D97757)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                        >
                            Instructor Mode
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Nav ── */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                <div className="px-4 mb-3 text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Navigate</div>

                <GameNavItem icon={<Home size={18} />} label="Dashboard"
                    active={location.pathname === '/instructor'}
                    onClick={() => navigate('/instructor')} />

                <GameNavItem icon={<TrendingUp size={18} />} label="Student Status"
                    active={location.pathname === '/instructor/status'}
                    onClick={() => navigate('/instructor/status')} />

                <GameNavItem icon={<GraduationCap size={18} />} label="Class Roster"
                    active={location.pathname === '/instructor/class'}
                    onClick={() => navigate('/instructor/class')} />

                <GameNavItem icon={<PlusCircle size={18} />} label="Create Course"
                    active={location.pathname === '/instructor/create'}
                    onClick={() => navigate('/instructor/create')} />

                <GameNavItem icon={<Users size={18} />} label="Enrollment Requests"
                    active={location.pathname === '/instructor/enrollments'}
                    onClick={() => navigate('/instructor/enrollments')} />

                <GameNavItem icon={<BookOpen size={18} />} label="Managed Courses"
                    active={location.pathname.includes('/instructor/managed')}
                    onClick={() => navigate('/instructor/managed')} />

                <GameNavItem icon={<BarChart2 size={18} />} label="Statistics"
                    active={location.pathname === '/instructor/stats'}
                    onClick={() => navigate('/instructor/stats')} />
            </div>

            {/* ── Instructor Card + Actions ── */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-white/8">

                {/* Instructor Card */}
                <div className="mb-3">
                    <div className="p-px rounded-[18px]" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.55), rgba(217,119,87,0.4), rgba(124,58,237,0.3))' }}>
                        <div className="bg-white dark:bg-[#16131A] rounded-[17px] p-3 space-y-2">

                            <div className="flex items-center gap-3">
                                <div className="relative flex-shrink-0">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 flex items-center justify-center text-3xl shadow-md select-none"
                                        style={{ boxShadow: '0 0 0 2px rgba(124,58,237,0.3), 0 4px 12px rgba(124,58,237,0.2)' }}>
                                        {currentAvatar.emoji}
                                    </div>
                                    {/* Instructor badge */}
                                    <div
                                        className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white leading-none select-none"
                                        style={{ background: 'linear-gradient(135deg, #7C3AED, #D97757)', boxShadow: '0 2px 6px rgba(124,58,237,0.5)' }}
                                    >
                                        PRO
                                    </div>
                                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-[#16131A]" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-800 dark:text-white truncate leading-tight">
                                        {user?.name || 'Instructor'}
                                    </p>
                                    <p
                                        className="text-[9px] font-black uppercase tracking-widest mt-0.5"
                                        style={{ background: 'linear-gradient(135deg, #7C3AED, #D97757)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                                    >
                                        Instructor
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
                                            <Trophy size={9} className="text-emerald-500" />
                                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">
                                                Lvl {courseUser?.totalXP ? Math.floor(courseUser.totalXP / 100) + 1 : 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20">
                                            <Zap size={9} className="text-purple-500" />
                                            <span className="text-[8px] font-black text-purple-600 dark:text-purple-400">{courseUser?.totalXP || 0} XP</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20">
                                            <Flame size={9} className="text-orange-500 fill-orange-500" />
                                            <span className="text-[8px] font-black text-orange-600 dark:text-orange-400">{courseUser?.streak || 0}d</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Icon-only action row */}
                <div className="flex items-center gap-1">
                    {user?.roles?.includes('student') && (
                        <button
                            onClick={() => navigate('/')}
                            title="Switch to Student"
                            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl hover:bg-orange-500/10 dark:hover:bg-orange-500/15 text-orange-500 dark:text-orange-400 transition-all border border-transparent hover:border-orange-500/20"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span className="text-[8px] font-black uppercase tracking-wide">Student</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        title="Settings"
                        className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    >
                        <Settings size={16} />
                        <span className="text-[8px] font-black uppercase tracking-wide">Settings</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400/60 hover:text-red-500 dark:hover:text-red-400 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                    >
                        <LogOut size={16} />
                        <span className="text-[8px] font-black uppercase tracking-wide">Logout</span>
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
                        <div>
                            <span className="font-display font-bold text-base text-slate-800 dark:text-white leading-none block">StudyLabs</span>
                            <span
                                className="text-[8px] font-black uppercase tracking-widest block"
                                style={{ background: 'linear-gradient(135deg, #7C3AED, #D97757)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                            >
                                Instructor
                            </span>
                        </div>
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
