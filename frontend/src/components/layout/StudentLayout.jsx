import React, { useState, useEffect } from 'react';
import { clickableProps } from '../../utils/a11y';
import {
    Settings,
    LogOut,
    Menu,
    Map,
    BookOpen,
    ChevronRight,
    ChevronDown,
    X,
    Flame,
    Zap,
    User,
    ShoppingBag,
    Trophy,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import useToastStore from '../../store/toastStore';
import SettingsModal from './SettingsModal';
import ToastManager from '../common/ToastManager';
import useGamificationStore, { AVATARS, TITLES } from '../../store/gamificationStore';
import { XP_PER_LEVEL } from '../../constants/gamification';
import StudentNotificationBell from './StudentNotificationBell';
import GlobalSearch from '../common/GlobalSearch';
import StatPill from '../common/StatPill';
import ProgressBar from '../common/ProgressBar';
import GradientBorderCard from '../common/GradientBorderCard';

/* ── Logo SVG ── */
const Logo = ({ size = 32 }) => (
    <div
        className="rounded-xl flex items-center justify-center flex-shrink-0 bg-grad-orange"
        style={{
            width: size,
            height: size,
            boxShadow: '0 0 16px rgba(217,119,87,0.5)',
        }}
    >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
            <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </div>
);

/* ── Game Nav Item ── */
const GameNavItem = ({ icon, label, active, onClick, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative group overflow-hidden ${
            active
                ? 'text-orange-700 dark:text-orange-300 bg-gradient-to-r from-orange-500/15 to-amber-500/5 dark:from-orange-500/20 dark:to-amber-500/8 border border-orange-500/30 dark:border-orange-500/40 shadow-sm'
                : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white/90 hover:bg-orange-500/5 dark:hover:bg-white/5 border border-transparent'
        }`}
        style={
            active
                ? {
                      boxShadow:
                          '-3px 0 12px rgba(217,119,87,0.2), inset 0 0 20px rgba(217,119,87,0.04)',
                  }
                : {}
        }
    >
        {/* Active left glow bar */}
        {active && (
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-orange-400 to-amber-500"
                style={{ boxShadow: '3px 0 10px rgba(217,119,87,0.8)' }}
            />
        )}

        {/* Hover shimmer sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />

        <span
            className={`transition-all duration-200 relative ${
                active
                    ? 'text-orange-500 dark:text-orange-400'
                    : 'text-slate-400 dark:text-white/35 group-hover:text-orange-400 dark:group-hover:text-orange-400/70'
            }`}
            style={active ? { filter: 'drop-shadow(0 0 6px rgba(217,119,87,0.7))' } : {}}
        >
            {icon}
        </span>

        <span className="relative flex-1 text-left">{label}</span>

        {/* Pulsing badge dot for shop */}
        {badge && !active && (
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0" />
        )}

        {active && (
            <ChevronRight size={12} className="ml-auto text-orange-500/70 relative shrink-0" />
        )}
    </button>
);

/* ── Sidebar Content ── */
const SidebarContent = ({ onNavigate, onOpenSettings }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { courses, selectedCourseId, setSelectedCourse } = useCourseStore();
    const { user, logout } = useAuthStore();
    const { activeAvatar, activeTitle, activeFrame, stats, coins } = useGamificationStore();
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = React.useState(false);

    const go = (path) => {
        navigate(path);
        onNavigate?.();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const currentAvatar = AVATARS.find((a) => a.id === activeAvatar) || {
        emoji: '🎓',
        name: 'Student',
    };
    const currentTitle = TITLES.find((t) => t.id === activeTitle) || { name: 'Beginner' };
    const xpInLevel = ((stats || {}).total_xp || 0) % XP_PER_LEVEL;

    return (
        <div className="flex flex-col h-full">
            {/* ── Logo + Coin Balance ── */}
            <div className="p-5 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo size={36} />
                        <span className="font-display font-bold text-xl text-slate-800 dark:text-white tracking-tight">
                            StudyLabs
                        </span>
                    </div>
                    <StatPill
                        emoji="💰"
                        value={(coins || 0).toLocaleString()}
                        variant="coins"
                        size="md"
                        title="Coins"
                        className="coin-shine cursor-default"
                    />
                </div>
            </div>

            {/* ── Search ── */}
            <div className="px-3 pb-2">
                <GlobalSearch />
            </div>

            {/* ── Nav Links ── */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                <div className="px-4 mb-3 text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                    Navigate
                </div>

                <GameNavItem
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                    }
                    label="Dashboard"
                    active={location.pathname === '/'}
                    onClick={() => go('/')}
                />
                <GameNavItem
                    icon={<BookOpen size={18} />}
                    label="My Courses"
                    active={location.pathname === '/my-courses'}
                    onClick={() => go('/my-courses')}
                />
                <GameNavItem
                    icon={<Map size={18} />}
                    label="Find Courses"
                    active={location.pathname === '/enrollments'}
                    onClick={() => go('/enrollments')}
                />
                <GameNavItem
                    icon={<User size={18} />}
                    label="Profile"
                    active={location.pathname === '/profile'}
                    onClick={() => go('/profile')}
                />
                <GameNavItem
                    icon={<Trophy size={18} />}
                    label="Leaderboard"
                    active={location.pathname === '/leaderboard'}
                    onClick={() => go('/leaderboard')}
                />
                <GameNavItem
                    icon={<ShoppingBag size={18} />}
                    label="Study Shop"
                    active={location.pathname === '/shop'}
                    onClick={() => go('/shop')}
                    badge={coins > 0}
                />

                {/* ⚔️ Current Quest */}
                {courses.length > 0 &&
                    (() => {
                        const selectedCourse =
                            courses.find((c) => c.id === selectedCourseId) || courses[0];
                        if (!selectedCourse) return null;

                        const completedNodes =
                            selectedCourse.nodes?.filter((n) => n.status === 'completed').length ||
                            0;
                        const totalNodes = selectedCourse.nodes?.length || 0;

                        return (
                            <div className="mt-5">
                                <div className="px-4 mb-2.5 flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                                    <span className="select-none">⚔️</span>
                                    <span>Current Quest</span>
                                </div>

                                <div className="relative px-1">
                                    {/* Current Selector */}
                                    <button
                                        onClick={() =>
                                            setIsCourseDropdownOpen(!isCourseDropdownOpen)
                                        }
                                        aria-expanded={isCourseDropdownOpen}
                                        aria-haspopup="listbox"
                                        className={`w-full text-left p-3 rounded-2xl border transition-all duration-300 ${
                                            isCourseDropdownOpen
                                                ? 'bg-orange-500/10 dark:bg-orange-500/15 border-orange-500/40'
                                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/8 hover:border-orange-500/30 hover:bg-orange-500/5 dark:hover:bg-orange-500/8'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 mb-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                                                {(selectedCourse.title || '')
                                                    .substring(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-black text-slate-800 dark:text-white truncate leading-tight">
                                                    {selectedCourse.title || 'Untitled'}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400">
                                                        {completedNodes}/{totalNodes} stages
                                                    </span>
                                                    <span className="px-1 rounded text-[8px] font-black bg-orange-500/15 text-orange-600 dark:text-orange-400">
                                                        {selectedCourse.progress || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronDown
                                                size={14}
                                                className={`text-slate-400 transition-transform duration-300 shrink-0 ${isCourseDropdownOpen ? 'rotate-180' : ''}`}
                                            />
                                        </div>

                                        {/* Animated progress bar */}
                                        <ProgressBar
                                            value={selectedCourse.progress || 0}
                                            variant="xp"
                                            height="md"
                                            animated={false}
                                            trackClassName="dark:bg-white/8"
                                        />
                                    </button>

                                    {/* Dropdown */}
                                    {isCourseDropdownOpen && (
                                        <div className="mt-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-1 shadow-md max-h-48 overflow-y-auto custom-scrollbar">
                                            {courses.map((course) => {
                                                const isCurrent = course.id === selectedCourseId;
                                                const cc =
                                                    course.nodes?.filter(
                                                        (n) => n.status === 'completed'
                                                    ).length || 0;
                                                const tc = course.nodes?.length || 0;
                                                return (
                                                    <button
                                                        key={course.id}
                                                        onClick={() => {
                                                            setSelectedCourse(course.id);
                                                            setIsCourseDropdownOpen(false);
                                                            if (location.pathname !== '/') go('/');
                                                            else onNavigate?.();
                                                        }}
                                                        className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                                                            isCurrent
                                                                ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/10 dark:border-orange-500/20 font-black'
                                                                : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-600 dark:text-white/60'
                                                        }`}
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">
                                                            {(course.title || '')
                                                                .substring(0, 2)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-black truncate">
                                                                {course.title || 'Untitled Course'}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-slate-400 dark:text-white/30 mt-0.5">
                                                                {cc}/{tc} stages ·{' '}
                                                                {course.progress || 0}%
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
            </div>

            {/* ── Player Card + Actions ── */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-white/8">
                {/* Player Card with gradient border */}
                <div
                    {...clickableProps(() => go('/profile'), 'Open my profile')}
                    className="cursor-pointer group/card mb-3"
                >
                    <GradientBorderCard
                        radius="rounded-[18px]"
                        innerRadius="rounded-[17px]"
                        gradientStyle="linear-gradient(135deg, rgba(217,119,87,0.55), rgba(124,58,237,0.4), rgba(217,119,87,0.3))"
                        innerClassName="bg-white dark:bg-[#1A1410] p-3 space-y-2.5"
                    >
                        {/* Avatar + name row */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                                <div
                                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-3xl shadow-md transition-transform duration-300 group-hover/card:scale-105 select-none avatar-frame-${activeFrame}`}
                                >
                                    {currentAvatar.emoji}
                                </div>
                                {/* Level badge */}
                                <div
                                    className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white leading-none select-none"
                                    style={{
                                        background: 'linear-gradient(135deg, #F59E0B, #D97757)',
                                        boxShadow: '0 2px 6px rgba(245,158,11,0.5)',
                                    }}
                                >
                                    LV {stats?.level || 1}
                                </div>
                                {/* Online dot */}
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-[#1A1410]" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-slate-800 dark:text-white truncate leading-tight">
                                    {user?.name || 'Student'}
                                </p>
                                {/* Gradient title */}
                                <p className="text-[9px] font-black uppercase tracking-widest mt-0.5 text-gradient-blue">
                                    {currentTitle.name}
                                </p>
                                {/* Mini stat pills */}
                                <div className="flex items-center gap-1.5 mt-1.5">
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20">
                                        <Zap size={9} className="text-amber-500" />
                                        <span className="text-[8px] font-black text-amber-600 dark:text-amber-400">
                                            {(stats?.total_xp || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20">
                                        <Flame
                                            size={9}
                                            className="text-orange-500 fill-orange-500"
                                        />
                                        <span className="text-[8px] font-black text-orange-600 dark:text-orange-400">
                                            {stats?.streak || 0}d
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* XP progress bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-white/25">
                                    XP to Level {(stats?.level || 1) + 1}
                                </span>
                                <span className="text-[8px] font-black text-orange-500">
                                    {xpInLevel}/{XP_PER_LEVEL}
                                </span>
                            </div>
                            <ProgressBar
                                value={xpInLevel}
                                variant="xp"
                                height="md"
                                animated={false}
                                trackClassName="dark:bg-white/8"
                            />
                        </div>
                    </GradientBorderCard>
                </div>

                {/* Icon-only action row */}
                <div className="flex items-center gap-1">
                    {user?.roles?.includes('instructor') && (
                        <button
                            onClick={() => {
                                useAuthStore.getState().switchRole('instructor');
                                navigate('/instructor');
                            }}
                            title="Switch to Instructor"
                            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl hover:bg-purple-500/10 dark:hover:bg-purple-500/15 text-purple-500 dark:text-purple-400 transition-all border border-transparent hover:border-purple-500/20"
                        >
                            <svg
                                className="w-4 h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                            </svg>
                            <span className="text-[8px] font-black uppercase tracking-wide">
                                Teacher
                            </span>
                        </button>
                    )}
                    <StudentNotificationBell dropUp />
                    <button
                        onClick={() => onOpenSettings()}
                        title="Settings"
                        className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    >
                        <Settings size={16} />
                        <span className="text-[8px] font-black uppercase tracking-wide">
                            Settings
                        </span>
                    </button>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400/60 hover:text-red-500 dark:hover:text-red-400 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                    >
                        <LogOut size={16} />
                        <span className="text-[8px] font-black uppercase tracking-wide">
                            Logout
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentLayout = ({ children }) => {
    const { user } = useAuthStore();
    const { stats } = useGamificationStore();
    const { addNotification } = useNotificationStore();
    const { addToast } = useToastStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Connect socket and listen for personal notifications
    useEffect(() => {
        if (!user?._id) return;
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
        const token = localStorage.getItem('studylabs_token');
        const socket = io(API_BASE_URL, { withCredentials: true, auth: { token } });

        socket.on('connect', () => {
            socket.emit('join_user', user._id);
        });

        socket.on('student_notification', (payload) => {
            addNotification(payload);
            addToast({
                type: 'info',
                title: payload.courseTitle || 'New Announcement',
                message: payload.message,
                icon: '📢',
                duration: 5000,
            });
        });

        return () => socket.disconnect();
    }, [user?._id, addNotification, addToast]);

    return (
        <div className="min-h-screen flex font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex flex-col w-72 sticky top-0 h-screen z-30 sidebar-theme">
                <SidebarContent
                    onNavigate={() => setIsSidebarOpen(false)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />
            </aside>

            {/* ── Mobile Overlay ── */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close menu"
                        className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/15 text-white/80 hover:bg-white/25 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <aside className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-72 sidebar-theme shadow-2xl">
                        <SidebarContent
                            onNavigate={() => setIsSidebarOpen(false)}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                        />
                    </aside>
                </div>
            )}

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Mobile header with HUD pills */}
                <header className="lg:hidden px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 glass-card border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <Logo size={30} />
                        <span className="font-display font-bold text-base text-slate-800 dark:text-white">
                            StudyLabs
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatPill
                            icon={Flame}
                            value={stats.streak || 0}
                            variant="streak"
                            size="sm"
                            title="Streak"
                        />
                        <StatPill
                            icon={Zap}
                            value={(stats.total_xp || 0).toLocaleString()}
                            variant="xp"
                            size="sm"
                            title="Total XP"
                        />
                        <StudentNotificationBell />
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/80 transition-colors"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 relative page-enter">{children}</main>
            </div>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <ToastManager />
        </div>
    );
};

export default StudentLayout;
