import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Home,
    Settings,
    LogOut,
    Menu,
    PlusCircle,
    BookOpen,
    ChevronRight,
    X,
    Users,
    TrendingUp,
    GraduationCap,
    BarChart2,
    BookMarked,
    Bell,
    Check,
    XCircle,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Spinner from '../common/Spinner';
import useAuthStore from '../../store/authStore';
import useCourseStore from '../../store/courseStore';
import useEnrollmentStore from '../../store/enrollmentStore';
import SettingsModal from './SettingsModal';
import useGamificationStore, { INSTRUCTOR_AVATARS } from '../../store/gamificationStore';
import AvatarDisplay from '../instructor/AvatarDisplay';
import { io } from 'socket.io-client';
import useNotificationStore from '../../store/notificationStore';
import useToastStore from '../../store/toastStore';

/* ── Logo SVG ── */
const Logo = ({ size = 32 }) => (
    <div
        className="rounded-xl flex items-center justify-center flex-shrink-0 bg-grad-instructor"
        style={{
            width: size,
            height: size,
            boxShadow: '0 0 16px rgba(124,58,237,0.5)',
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

/* ── Purple Game Nav Item ── */
const GameNavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative group overflow-hidden ${
            active
                ? 'text-purple-700 dark:text-purple-300 bg-gradient-to-r from-purple-500/15 to-violet-500/5 dark:from-purple-500/20 dark:to-violet-500/8 border border-purple-500/30 dark:border-purple-500/40 shadow-sm'
                : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white/90 hover:bg-purple-500/5 dark:hover:bg-white/5 border border-transparent'
        }`}
        style={
            active
                ? {
                      boxShadow:
                          '-3px 0 12px rgba(124,58,237,0.2), inset 0 0 20px rgba(124,58,237,0.04)',
                  }
                : {}
        }
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
        {active && (
            <ChevronRight size={12} className="ml-auto text-purple-500/70 relative shrink-0" />
        )}
    </button>
);

/* ── Notification Bell ── */
const NotificationBell = () => {
    const {
        pendingEnrollments,
        fetchPendingEnrollments,
        approvePendingEnrollment,
        denyPendingEnrollment,
    } = useEnrollmentStore();
    const { courses } = useCourseStore();
    const { notifications, markAllRead } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    const formatError = (err) => {
        if (!err) return '';
        let text = err;
        try {
            if (text.includes('{')) {
                const jsonStr = text.substring(text.indexOf('{'));
                const parsed = JSON.parse(jsonStr);
                if (parsed.detail) text = parsed.detail;
            }
        } catch {
            // retain original string on parse failure
        }
        return text.replace(/^AI Service Error \(\d+\):\s*/i, '');
    };

    const failedCourseNotifs = (courses || [])
        .filter((c) => c.generationStatus === 'failed' || c.generationError)
        .map((c) => ({
            id: `failed-${c._id || c.id}`,
            courseId: c._id || c.id,
            courseTitle: c.title,
            message: c.generationError
                ? `Course "${c.title}" error: ${formatError(c.generationError)}`
                : `Course "${c.title}" generation failed`,
            type: 'generation_failed',
            read: false,
        }));

    const [dismissedAlerts, setDismissedAlerts] = useState([]);

    const handleDismissAlert = (e, notifId) => {
        e.stopPropagation();
        setDismissedAlerts((prev) => [...prev, notifId]);
    };

    const allNotifications = [
        ...failedCourseNotifs,
        ...notifications.filter(
            (n) => !failedCourseNotifs.some((fc) => fc.courseId === n.courseId)
        ),
    ].filter((n) => !dismissedAlerts.includes(n.id || n._id));

    const refresh = useCallback(() => {
        fetchPendingEnrollments();
    }, [fetchPendingEnrollments]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, [refresh]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleApprove = async (id) => {
        setActionLoading(id + '-approve');
        try {
            await approvePendingEnrollment(id);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeny = async (id) => {
        setActionLoading(id + '-deny');
        try {
            await denyPendingEnrollment(id);
        } finally {
            setActionLoading(null);
        }
    };

    const unreadNotifs = allNotifications.filter((n) => !n.read).length;
    const count = unreadNotifs + pendingEnrollments.length;

    const handleToggle = () => {
        setIsOpen((o) => {
            const next = !o;
            if (next && unreadNotifs > 0) markAllRead();
            return next;
        });
    };

    return (
        <div className="relative flex-1" ref={panelRef}>
            <button
                onClick={handleToggle}
                title="Alerts & Requests"
                className={`w-full flex flex-col items-center gap-0.5 py-2 rounded-xl relative transition-all border ${
                    count > 0
                        ? 'text-amber-500 hover:bg-amber-500/10 border-transparent hover:border-amber-500/20'
                        : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                }`}
            >
                <div className="relative">
                    <Bell size={16} />
                    {count > 0 && (
                        <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                            {count > 9 ? '9+' : count}
                        </span>
                    )}
                </div>
                <span className="text-[8px] font-black uppercase tracking-wide">Alerts</span>
            </button>

            {isOpen && (
                <div
                    className="absolute bottom-full mb-2 bg-white dark:bg-[#1a1625] rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50"
                    style={{ maxHeight: '360px', width: '300px', left: 0 }}
                >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/8 flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-700 dark:text-white/80 uppercase tracking-wider">
                            Alerts & Notifications
                        </span>
                        {count > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black">
                                {count} new
                            </span>
                        )}
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                        {/* Course Notifications Section */}
                        {allNotifications.length > 0 && (
                            <div className="border-b border-slate-100 dark:border-white/5">
                                {allNotifications.slice(0, 5).map((n) => (
                                    <div
                                        key={n.id || n._id}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                if (n.courseId) navigate(`/course/${n.courseId}`);
                                                setIsOpen(false);
                                            }
                                        }}
                                        onClick={() => {
                                            if (n.courseId) navigate(`/course/${n.courseId}`);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-start justify-between gap-2 px-3 py-2 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors cursor-pointer group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-slate-800 dark:text-white/90 leading-tight">
                                                {n.message}
                                            </p>
                                            {n.courseTitle && (
                                                <p className="text-[9px] text-slate-400 dark:text-white/40 mt-0.5">
                                                    {n.courseTitle}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => handleDismissAlert(e, n.id || n._id)}
                                            title="Dismiss notification"
                                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Enrollment Requests Section */}
                        {pendingEnrollments.length === 0 && allNotifications.length === 0 ? (
                            <div className="py-6 flex flex-col items-center gap-2 text-slate-400 dark:text-white/30">
                                <Bell size={20} />
                                <span className="text-[11px] font-bold">No alerts or requests</span>
                            </div>
                        ) : (
                            pendingEnrollments.map((e) => (
                                <div
                                    key={e._id}
                                    className="px-3 py-2.5 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
                                >
                                    <div className="flex items-start gap-2 mb-1.5">
                                        <AvatarDisplay
                                            photoUrl={e.student?.photoUrl}
                                            avatar={e.student?.avatar}
                                            name={e.student?.name}
                                            size="w-7 h-7 text-[10px]"
                                            shape="rounded-lg"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold text-slate-800 dark:text-white/90 truncate leading-tight">
                                                {e.student?.name}
                                            </p>
                                            <p className="text-[9px] text-slate-400 dark:text-white/35 truncate">
                                                {e.course?.title}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => handleApprove(e._id)}
                                            disabled={!!actionLoading}
                                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black transition-colors border border-emerald-500/20 disabled:opacity-50"
                                        >
                                            {actionLoading === e._id + '-approve' ? (
                                                <Spinner
                                                    size="xs"
                                                    color="emerald"
                                                    label="Approving"
                                                />
                                            ) : (
                                                <>
                                                    <Check size={10} /> Approve
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDeny(e._id)}
                                            disabled={!!actionLoading}
                                            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-[10px] font-black transition-colors border border-red-500/20 disabled:opacity-50"
                                        >
                                            {actionLoading === e._id + '-deny' ? (
                                                <Spinner size="xs" color="red" label="Denying" />
                                            ) : (
                                                <>
                                                    <XCircle size={10} /> Deny
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SidebarContent = ({ onNavigate, onOpenSettings }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { instructorStats } = useCourseStore();
    const { activeAvatar } = useGamificationStore();

    const go = (path) => {
        navigate(path);
        onNavigate?.();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const currentAvatar =
        INSTRUCTOR_AVATARS.find((a) => a.id === activeAvatar) || INSTRUCTOR_AVATARS[0];

    const activeCourses = instructorStats?.generation?.readyCourses ?? '—';
    const totalStudents = instructorStats?.enrollments?.totalStudents ?? '—';
    const completionRate =
        instructorStats?.engagement?.avgCompletionRate != null
            ? `${instructorStats.engagement.avgCompletionRate}%`
            : '—';

    return (
        <div className="flex flex-col h-full">
            {/* ── Logo ── */}
            <div className="p-5 pb-4">
                <div className="flex items-center gap-3">
                    <Logo size={36} />
                    <div>
                        <span className="font-display font-bold text-xl text-slate-800 dark:text-white leading-none block tracking-tight">
                            StudyLabs
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest mt-0.5 block text-gradient-instructor">
                            Instructor Mode
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Nav ── */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                <div className="px-4 mb-3 text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
                    Navigate
                </div>

                <GameNavItem
                    icon={<Home size={18} />}
                    label="Dashboard"
                    active={location.pathname === '/instructor'}
                    onClick={() => go('/instructor')}
                />

                <GameNavItem
                    icon={<TrendingUp size={18} />}
                    label="Student Status"
                    active={location.pathname === '/instructor/status'}
                    onClick={() => go('/instructor/status')}
                />

                <GameNavItem
                    icon={<GraduationCap size={18} />}
                    label="Class Roster"
                    active={location.pathname === '/instructor/class'}
                    onClick={() => go('/instructor/class')}
                />

                <GameNavItem
                    icon={<PlusCircle size={18} />}
                    label="Create Course"
                    active={location.pathname === '/instructor/create'}
                    onClick={() => go('/instructor/create')}
                />

                <GameNavItem
                    icon={<BookOpen size={18} />}
                    label="Managed Courses"
                    active={location.pathname.includes('/instructor/managed')}
                    onClick={() => go('/instructor/managed')}
                />

                <GameNavItem
                    icon={<BarChart2 size={18} />}
                    label="Statistics"
                    active={location.pathname === '/instructor/stats'}
                    onClick={() => go('/instructor/stats')}
                />
            </div>

            {/* ── Instructor Card + Actions ── */}
            <div className="p-4 pt-3 border-t border-slate-200 dark:border-white/8">
                {/* Instructor Card */}
                <div className="mb-3">
                    <div
                        className="p-px rounded-[18px]"
                        style={{
                            background:
                                'linear-gradient(135deg, rgba(124,58,237,0.55), rgba(217,119,87,0.4), rgba(124,58,237,0.3))',
                        }}
                    >
                        <div className="bg-white dark:bg-[#16131A] rounded-[17px] p-3 space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="relative flex-shrink-0">
                                    <div
                                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 flex items-center justify-center text-3xl shadow-md select-none"
                                        style={{
                                            boxShadow:
                                                '0 0 0 2px rgba(124,58,237,0.3), 0 4px 12px rgba(124,58,237,0.2)',
                                        }}
                                    >
                                        {currentAvatar.emoji}
                                    </div>
                                    {/* Instructor badge */}
                                    <div
                                        className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white leading-none select-none bg-grad-instructor"
                                        style={{ boxShadow: '0 2px 6px rgba(124,58,237,0.5)' }}
                                    >
                                        PRO
                                    </div>
                                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-[#16131A]" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-slate-800 dark:text-white truncate leading-tight">
                                        {user?.name || 'Instructor'}
                                    </p>
                                    <p className="text-[9px] font-black uppercase tracking-widest mt-0.5 text-gradient-instructor">
                                        Instructor
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
                                            <BookMarked size={9} className="text-emerald-500" />
                                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400">
                                                {activeCourses} courses
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20">
                                            <Users size={9} className="text-purple-500" />
                                            <span className="text-[8px] font-black text-purple-600 dark:text-purple-400">
                                                {totalStudents} students
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20">
                                            <TrendingUp size={9} className="text-orange-500" />
                                            <span className="text-[8px] font-black text-orange-600 dark:text-orange-400">
                                                {completionRate}
                                            </span>
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
                            onClick={() => {
                                useAuthStore.getState().switchRole('student');
                                navigate('/');
                            }}
                            title="Switch to Student"
                            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl hover:bg-orange-500/10 dark:hover:bg-orange-500/15 text-orange-500 dark:text-orange-400 transition-all border border-transparent hover:border-orange-500/20"
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
                                Student
                            </span>
                        </button>
                    )}
                    <NotificationBell />
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

/* ── Mobile Bell (simple icon + badge linking to managed courses enrollments tab) ── */
const MobileBellButton = () => {
    const { pendingEnrollments } = useEnrollmentStore();
    const navigate = useNavigate();
    const count = pendingEnrollments.length;
    return (
        <button
            onClick={() => navigate('/instructor/managed?tab=enrollments')}
            className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-white/80"
        >
            <Bell size={20} className={count > 0 ? 'text-amber-500' : ''} />
            {count > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </button>
    );
};

const InstructorLayout = ({ children }) => {
    const { fetchInstructorStats } = useCourseStore();
    const { user } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        if (!user?._id) return;
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
        const token = localStorage.getItem('studylabs_token');
        const socket = io(API_BASE_URL, { withCredentials: true, auth: { token } });

        socket.on('connect', () => {
            socket.emit('join_user', user._id);
        });

        socket.on('instructor_notification', (data) => {
            useNotificationStore.getState().addNotification(data);

            // Show toast based on type
            const toastStore = useToastStore.getState();
            switch (data.type) {
                case 'generation_complete':
                    toastStore.success('Course Ready', data.message);
                    break;
                case 'generation_failed':
                    toastStore.error('Generation Failed', data.message);
                    break;
                case 'material_update_complete':
                    toastStore.success('Materials Updated', data.message);
                    break;
                case 'low_quality_warning':
                    toastStore.info('Quality Notice', data.message);
                    break;
                default:
                    toastStore.info('Notification', data.message);
            }
        });

        return () => socket.disconnect();
    }, [user?._id]);

    useEffect(() => {
        fetchInstructorStats();
    }, [fetchInstructorStats]);

    return (
        <div className="min-h-screen flex font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-72 sticky top-0 h-screen z-30 sidebar-theme">
                <SidebarContent
                    onNavigate={() => setIsSidebarOpen(false)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                    <aside className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-72 sidebar-theme shadow-2xl">
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <SidebarContent
                            onNavigate={() => setIsSidebarOpen(false)}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                        />
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
                            <span className="font-display font-bold text-base text-slate-800 dark:text-white leading-none block">
                                StudyLabs
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest block text-gradient-instructor">
                                Instructor
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <MobileBellButton />
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

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isInstructor={true}
            />
        </div>
    );
};

export default InstructorLayout;
