import React, { useEffect, useState } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import {
    Users,
    BookOpen,
    PlusCircle,
    TrendingUp,
    CheckCircle,
    Clock,
    BarChart2,
    GraduationCap,
    ChevronRight,
    Check,
    XCircle,
    AlertCircle,
    Zap,
    Bell,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../store/courseStore';
import Spinner from '../components/common/Spinner';
import useEnrollmentStore from '../store/enrollmentStore';
import useAuthStore from '../store/authStore';
import AtRiskStudentsWidget from '../components/analytics/AtRiskStudentsWidget';

/* ── Helpers ── */
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function fmt(val, suffix = '') {
    if (val == null) return '—';
    return `${val}${suffix}`;
}

const STATUS_STYLES = {
    ready: {
        cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        label: 'Ready',
    },
    failed: {
        cls: 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/25',
        label: 'Failed',
    },
    generating: {
        cls: 'bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/25',
        label: 'Generating',
    },
    pending: {
        cls: 'bg-slate-400/15 text-slate-500 dark:text-slate-400 border-slate-400/25',
        label: 'Pending',
    },
};

/* ── KPI Card ── */
const KpiCard = ({ label, value, icon, color, pulse }) => {
    const colors = {
        purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
        orange: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
        green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    };
    const glows = {
        purple: 'rgba(124,58,237,0.18)',
        orange: 'rgba(217,119,87,0.18)',
        amber: 'rgba(245,158,11,0.18)',
        green: 'rgba(16,185,129,0.18)',
        blue: 'rgba(59,130,246,0.18)',
    };
    return (
        <div
            className="relative bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] group overflow-hidden"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
        >
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${glows[color]} 0%, transparent 70%)`,
                }}
            />
            <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colors[color]} relative`}
            >
                {icon}
                {pulse && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#16131A] animate-pulse" />
                )}
            </div>
            <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/35 mb-0.5">
                    {label}
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                    {value}
                </p>
            </div>
        </div>
    );
};

/* ── Quick Action Card ── */
const ActionCard = ({ label, sub, icon, onClick, gradient }) => (
    <button
        onClick={onClick}
        className="group relative p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-lg bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 overflow-hidden flex items-center gap-3"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
    >
        <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-md"
            style={{ background: gradient }}
        >
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                {label}
            </p>
            {sub && (
                <p className="text-[11px] text-slate-400 dark:text-white/35 mt-0.5 leading-tight">
                    {sub}
                </p>
            )}
        </div>
        <ChevronRight
            size={14}
            className="text-slate-300 dark:text-white/20 group-hover:text-slate-500 dark:group-hover:text-white/50 transition-colors flex-shrink-0"
        />
    </button>
);

/* ── Recent Courses List ── */
const RecentCourseRow = ({ course, onClick }) => {
    const s = STATUS_STYLES[course.generationStatus] || STATUS_STYLES.pending;
    const date = course.createdAt
        ? new Date(course.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : '—';
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group text-left"
        >
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                <BookOpen size={14} className="text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">
                    {course.title}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-white/35">{date}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-white/30">
                    <Users size={10} />
                    {course.studentCount ?? 0}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${s.cls}`}>
                    {s.label}
                </span>
            </div>
        </button>
    );
};

/* ── Pending Enrollment Row ── */
const PendingRow = ({ enrollment, onApprove, onDeny, loadingId }) => {
    const approving = loadingId === enrollment._id + '-approve';
    const denying = loadingId === enrollment._id + '-deny';
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40 flex items-center justify-center flex-shrink-0 text-sm">
                {enrollment.student?.avatar ? (
                    <img
                        src={enrollment.student.avatar}
                        alt={
                            enrollment.student?.name
                                ? `${enrollment.student.name}'s avatar`
                                : 'Student avatar'
                        }
                        className="w-8 h-8 rounded-lg object-cover"
                    />
                ) : (
                    <span className="text-[11px] font-black text-purple-600 dark:text-purple-400">
                        {enrollment.student?.name?.[0]?.toUpperCase() || '?'}
                    </span>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate leading-tight">
                    {enrollment.student?.name}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-white/35 truncate">
                    {enrollment.course?.title}
                </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
                <button
                    onClick={() => onApprove(enrollment._id)}
                    disabled={!!loadingId}
                    className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20 transition-colors disabled:opacity-50"
                >
                    {approving ? (
                        <Spinner size="xs" color="emerald" label="Approving" />
                    ) : (
                        <>
                            <Check size={10} /> Approve
                        </>
                    )}
                </button>
                <button
                    onClick={() => onDeny(enrollment._id)}
                    disabled={!!loadingId}
                    className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-[10px] font-black border border-red-500/20 transition-colors disabled:opacity-50"
                >
                    {denying ? (
                        <Spinner size="xs" color="red" label="Denying" />
                    ) : (
                        <>
                            <XCircle size={10} /> Deny
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

/* ── Section Card wrapper ── */
const SectionCard = ({ title, icon, action, children }) => (
    <div
        className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
    >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/8">
            <div className="flex items-center gap-2">
                <span className="text-slate-400 dark:text-white/30">{icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60">
                    {title}
                </span>
            </div>
            {action}
        </div>
        <div>{children}</div>
    </div>
);

/* ── Main Component ── */
const InstructorDashboard = () => {
    const navigate = useNavigate();
    const { instructorStats, fetchAllCourses, isLoading } = useCourseStore();
    const { pendingEnrollments, approvePendingEnrollment, denyPendingEnrollment } =
        useEnrollmentStore();
    const { user } = useAuthStore();
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchAllCourses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const g = instructorStats?.generation ?? {};
    const e = instructorStats?.enrollments ?? {};
    const eng = instructorStats?.engagement ?? {};
    const recentCourses = (instructorStats?.recentCourses ?? []).slice(0, 5);
    const pendingCount = pendingEnrollments.length;
    const visiblePending = pendingEnrollments.slice(0, 4);

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

    return (
        <InstructorLayout title="Instructor Dashboard">
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(217,119,87,0.08) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-[1] space-y-6 p-4 sm:p-6 md:p-8 pb-32 max-w-[1200px] mx-auto">
                {/* ── Welcome Banner ── */}
                <div
                    className="relative overflow-hidden rounded-2xl p-5 sm:p-6 border border-purple-500/20 dark:border-purple-500/25"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(217,119,87,0.06) 100%)',
                    }}
                >
                    <div
                        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-30 pointer-events-none"
                        style={{
                            background:
                                'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
                            filter: 'blur(30px)',
                            transform: 'translate(30%, -30%)',
                        }}
                    />
                    <div className="relative">
                        <p className="text-[11px] font-black uppercase tracking-widest text-purple-500 dark:text-purple-400 mb-1">
                            {getGreeting()}
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-800 dark:text-white tracking-tight">
                            {user?.name?.split(' ')[0] || 'Instructor'} 👋
                        </h1>
                        <p className="text-slate-500 dark:text-white/50 text-sm mt-1">
                            Here's an overview of your courses and students.
                        </p>
                        {pendingCount > 0 && (
                            <button
                                onClick={() => navigate('/instructor/managed?tab=enrollments')}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[11px] font-black hover:bg-amber-500/25 transition-colors"
                            >
                                <Bell size={11} />
                                {pendingCount} enrollment request{pendingCount !== 1 ? 's' : ''}{' '}
                                waiting
                                <ChevronRight size={10} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── KPI Row ── */}
                {isLoading && !instructorStats ? (
                    <div className="h-28 w-full flex items-center justify-center">
                        <Spinner color="purple" label="Loading stats" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                        <KpiCard
                            label="Active Courses"
                            value={fmt(g.readyCourses)}
                            icon={<BookOpen size={16} />}
                            color="purple"
                        />
                        <KpiCard
                            label="Total Students"
                            value={fmt(e.totalStudents)}
                            icon={<Users size={16} />}
                            color="orange"
                        />
                        <KpiCard
                            label="Pending Requests"
                            value={fmt(pendingCount)}
                            icon={<Bell size={16} />}
                            color="amber"
                            pulse={pendingCount > 0}
                        />
                        <KpiCard
                            label="Avg Completion"
                            value={fmt(eng.avgCompletionRate, '%')}
                            icon={<TrendingUp size={16} />}
                            color="green"
                        />
                        <KpiCard
                            label="Success Rate"
                            value={fmt(g.successRate, '%')}
                            icon={<Zap size={16} />}
                            color="blue"
                        />
                    </div>
                )}

                {/* ── Main Two-Column Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* ── Left: Quick Actions + Course Health ── */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Quick Actions */}
                        <SectionCard title="Quick Actions" icon={<Zap size={13} />}>
                            <div className="p-3 space-y-2">
                                <ActionCard
                                    label="Create Course"
                                    sub="Start a new AI-generated course"
                                    icon={<PlusCircle size={18} />}
                                    gradient="linear-gradient(135deg, #7C3AED, #9333EA)"
                                    onClick={() => navigate('/instructor/create')}
                                />
                                <ActionCard
                                    label="Managed Courses"
                                    sub="Edit, delete or regenerate"
                                    icon={<BookOpen size={18} />}
                                    gradient="linear-gradient(135deg, #D97757, #F59E0B)"
                                    onClick={() => navigate('/instructor/managed')}
                                />
                                <ActionCard
                                    label="Class Roster"
                                    sub="View student performance"
                                    icon={<GraduationCap size={18} />}
                                    gradient="linear-gradient(135deg, #0EA5E9, #3B82F6)"
                                    onClick={() => navigate('/instructor/class')}
                                />
                                <ActionCard
                                    label="Statistics"
                                    sub="Detailed analytics & reports"
                                    icon={<BarChart2 size={18} />}
                                    gradient="linear-gradient(135deg, #10B981, #059669)"
                                    onClick={() => navigate('/instructor/stats')}
                                />
                            </div>
                        </SectionCard>

                        {/* Course Health — only show if there are courses */}
                        {g.totalCourses > 0 && (
                            <SectionCard title="Course Health" icon={<CheckCircle size={13} />}>
                                <div className="p-4 space-y-2.5">
                                    {[
                                        {
                                            label: 'Ready',
                                            count: g.readyCourses ?? 0,
                                            total: g.totalCourses,
                                            bar: 'bg-emerald-500',
                                            text: 'text-emerald-600 dark:text-emerald-400',
                                        },
                                        {
                                            label: 'Generating',
                                            count: g.generatingCourses ?? 0,
                                            total: g.totalCourses,
                                            bar: 'bg-blue-500',
                                            text: 'text-blue-600 dark:text-blue-400',
                                        },
                                        {
                                            label: 'Failed',
                                            count: g.failedCourses ?? 0,
                                            total: g.totalCourses,
                                            bar: 'bg-red-500',
                                            text: 'text-red-500 dark:text-red-400',
                                        },
                                    ].map(({ label, count, total, bar, text }) => (
                                        <div key={label}>
                                            <div className="flex justify-between text-[11px] mb-1">
                                                <span className="font-bold text-slate-500 dark:text-white/40">
                                                    {label}
                                                </span>
                                                <span className={`font-black ${text}`}>
                                                    {count}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${bar} rounded-full transition-all duration-700`}
                                                    style={{
                                                        width:
                                                            total > 0
                                                                ? `${(count / total) * 100}%`
                                                                : '0%',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </div>

                    {/* ── Right: Recent Courses + Pending Enrollments + At-Risk ── */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Recent Courses */}
                        <SectionCard
                            title="Recent Courses"
                            icon={<Clock size={13} />}
                            action={
                                <button
                                    onClick={() => navigate('/instructor/managed')}
                                    className="text-[10px] font-black text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-0.5 transition-colors"
                                >
                                    View all <ChevronRight size={10} />
                                </button>
                            }
                        >
                            {recentCourses.length === 0 ? (
                                <div className="py-10 flex flex-col items-center gap-3 text-slate-400 dark:text-white/30">
                                    <BookOpen size={28} className="opacity-40" />
                                    <p className="text-sm font-bold">No courses yet</p>
                                    <button
                                        onClick={() => navigate('/instructor/create')}
                                        className="text-[11px] font-black text-purple-500 dark:text-purple-400 hover:underline"
                                    >
                                        Create your first course →
                                    </button>
                                </div>
                            ) : (
                                <div className="p-2">
                                    {recentCourses.map((course) => (
                                        <RecentCourseRow
                                            key={course._id}
                                            course={course}
                                            onClick={() => navigate('/instructor/managed')}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>

                        {/* Pending Enrollments */}
                        <SectionCard
                            title="Pending Enrollments"
                            icon={<Bell size={13} />}
                            action={
                                pendingCount > 4 ? (
                                    <button
                                        onClick={() =>
                                            navigate('/instructor/managed?tab=enrollments')
                                        }
                                        className="text-[10px] font-black text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-0.5 transition-colors"
                                    >
                                        +{pendingCount - 4} more <ChevronRight size={10} />
                                    </button>
                                ) : null
                            }
                        >
                            {visiblePending.length === 0 ? (
                                <div className="py-8 flex flex-col items-center gap-2 text-slate-400 dark:text-white/30">
                                    <CheckCircle size={24} className="opacity-40" />
                                    <p className="text-sm font-bold">All caught up!</p>
                                    <p className="text-[11px]">No pending enrollment requests.</p>
                                </div>
                            ) : (
                                <div className="p-2">
                                    {visiblePending.map((enrollment) => (
                                        <PendingRow
                                            key={enrollment._id}
                                            enrollment={enrollment}
                                            onApprove={handleApprove}
                                            onDeny={handleDeny}
                                            loadingId={actionLoading}
                                        />
                                    ))}
                                </div>
                            )}
                        </SectionCard>
                        {/* At-Risk Students */}
                        {(instructorStats?.recentCourses || []).length > 0 && (
                            <AtRiskStudentsWidget courses={instructorStats.recentCourses} />
                        )}
                    </div>
                </div>
            </div>
        </InstructorLayout>
    );
};

export default InstructorDashboard;
