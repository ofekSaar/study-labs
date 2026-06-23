import React, { useEffect, useState, useMemo } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import {
  Users, BookOpen, Trophy, TrendingUp, Brain,
  ChevronUp, ChevronDown, ChevronsUpDown,
  AlertTriangle, Medal, Zap, Star, Activity,
  CheckCircle, Search, Flame,
} from 'lucide-react';
import useCourseStore from '../store/courseStore';
import api from '../utils/api';

// ── helpers ────────────────────────────────────────────────────────────────────

function difficultyFromPct(pct) {
  if (pct >= 70) return {
    label: 'Easy',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  };
  if (pct >= 30) return {
    label: 'Medium',
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  };
  return {
    label: 'Challenging',
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
  };
}

function relativeTime(dateStr) {
  if (!dateStr) return 'Never';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function studentBadge(s) {
  if (s.completion === 0) return {
    label: 'Not Started',
    color: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10',
  };
  const daysSince = s.lastActivityDate
    ? Math.floor((Date.now() - new Date(s.lastActivityDate).getTime()) / 86400000)
    : 999;
  if (s.completion < 30 || daysSince > 7) return {
    label: 'At Risk',
    color: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
  };
  return {
    label: 'On Track',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  };
}

function levelFromXP(xp) {
  return Math.floor((xp || 0) / 100) + 1;
}

function completionBarGradient(pct) {
  if (pct >= 70) return 'from-emerald-500 to-teal-400';
  if (pct >= 30) return 'from-amber-500 to-orange-400';
  return 'from-red-500 to-rose-400';
}

function issueConfig(issue) {
  if (!issue || issue === 'Never started') return {
    label: 'Never started',
    cls: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
  };
  if (issue.startsWith('Inactive')) return {
    label: issue,
    cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30',
  };
  return {
    label: 'Low progress',
    cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  };
}

const RANK_MEDAL = ['🥇', '🥈', '🥉'];

// ── skeleton loaders ───────────────────────────────────────────────────────────

const TableSkeleton = ({ cols = 4, rows = 5 }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
    <table className="w-full border-collapse">
      <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            {Array.from({ length: cols }).map((_, j) => (
              <td key={j} className="px-5 py-4">
                <div
                  className="h-4 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse"
                  style={{ width: `${55 + (j * 17 + i * 11) % 35}%` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CardSkeleton = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-3/4" />
          <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// ── mini SVG progress ring ─────────────────────────────────────────────────────

const MiniRing = ({ pct, size = 52, stroke = 6, color = '#8B5CF6' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-white/10" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
      />
    </svg>
  );
};

// ── class health score widget ──────────────────────────────────────────────────

const ClassHealthScore = ({ score, avgCompletion, retentionHealth, atRiskCount, totalStudents, isLoading }) => {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(score, 100) / 100) * circ;
  const ringColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Needs Attention' : 'At Risk';
  const labelColor = score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-8 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          {isLoading ? (
            <div className="w-[140px] h-[140px] rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
          ) : (
            <>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="14" className="text-slate-100 dark:text-white/8" />
                <circle
                  cx="70" cy="70" r={r}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="14"
                  strokeDasharray={`${filled} ${circ}`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 10px ${ringColor}60)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">{score}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${labelColor}`}>{label}</span>
              </div>
            </>
          )}
        </div>

        {/* Label + indicators */}
        <div className="flex-1">
          <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-1">Class Health Score</h3>
          <p className="text-sm text-slate-500 dark:text-white/50 mb-6">Overall snapshot of engagement, completion &amp; retention</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <HealthIndicator label="Avg Completion" value={`${Math.round(avgCompletion)}%`} color="text-indigo-500" icon={<TrendingUp size={14} />} />
            <HealthIndicator label="Retention Rate" value={`${Math.round(retentionHealth)}%`} color="text-emerald-500" icon={<Activity size={14} />} />
            <HealthIndicator label="At-Risk Students" value={atRiskCount} color="text-red-500" icon={<AlertTriangle size={14} />} />
            <HealthIndicator label="Total Students" value={totalStudents} color="text-purple-500" icon={<Users size={14} />} />
          </div>
        </div>
      </div>
    </div>
  );
};

const HealthIndicator = ({ label, value, color, icon }) => (
  <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${color}`}>
      {icon}{label}
    </span>
    <span className="text-2xl font-black text-slate-900 dark:text-white">{value}</span>
  </div>
);

// ── top performers widget ──────────────────────────────────────────────────────

const TopPerformers = ({ leaderboard, loading }) => {
  const top3 = leaderboard.slice(0, 3);
  return (
    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-6 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
        <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-500/10">
          <Medal size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        Top Performers
      </h3>
      <div className="space-y-2 relative z-10">
        {loading ? (
          <CardSkeleton rows={3} />
        ) : top3.length === 0 ? (
          <EmptyState icon={<Medal size={18} />} title="No data yet" compact />
        ) : (
          top3.map((s, i) => (
            <div key={s.userId || i} className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
              i === 0 ? 'bg-amber-50/60 border-amber-200/60 dark:bg-amber-500/8 dark:border-amber-500/20' :
              i === 1 ? 'bg-slate-100/60 border-slate-200/60 dark:bg-white/5 dark:border-white/10' :
              'bg-orange-50/40 border-orange-200/40 dark:bg-orange-500/5 dark:border-orange-500/15'
            }`}>
              <span className="text-2xl w-8 text-center flex-shrink-0 select-none">{RANK_MEDAL[i]}</span>
              <AvatarDisplay avatar={s.avatar} size="w-9 h-9" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">{s.name || 'Student'}</p>
                <p className="text-[11px] text-slate-400 dark:text-white/40 font-medium">Lv.{s.level || levelFromXP(s.xp)} · {(s.xp || 0).toLocaleString()} XP</p>
              </div>
              <span className="text-amber-500 dark:text-amber-400 flex-shrink-0">
                <Zap size={14} />
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ── avatar helper ──────────────────────────────────────────────────────────────

const AvatarDisplay = ({ avatar, size = 'w-10 h-10' }) => {
  if (avatar && (avatar.startsWith('http') || avatar.startsWith('/'))) {
    return <img src={avatar} alt="" className={`${size} rounded-full border border-slate-200 dark:border-white/10 flex-shrink-0 object-cover`} />;
  }
  return (
    <div className={`${size} rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-base flex-shrink-0 select-none`}>
      {avatar || '🎓'}
    </div>
  );
};

// ── concept card ──────────────────────────────────────────────────────────────

const ConceptCard = ({ item }) => {
  const ringColor = item.masteryLevel > 85 ? '#10b981' : item.masteryLevel > 72 ? '#f59e0b' : '#ef4444';
  const bgCls = item.masteryLevel > 85
    ? 'bg-emerald-50/60 dark:bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-500/15'
    : item.masteryLevel > 72
    ? 'bg-amber-50/60 dark:bg-amber-500/5 border-amber-200/50 dark:border-amber-500/15'
    : 'bg-red-50/60 dark:bg-red-500/5 border-red-200/50 dark:border-red-500/15';
  const chipCls = item.status === 'Excellent'
    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
    : item.status === 'Moderate'
    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
    : 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30';

  return (
    <div className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all hover:scale-[1.02] ${bgCls}`}>
      <MiniRing pct={item.masteryLevel} size={72} stroke={7} color={ringColor} />
      <div className="text-center">
        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight line-clamp-2 mb-2">{item.topic}</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">{item.masteryLevel}%</span>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${chipCls}`}>
            {item.status}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── main component ─────────────────────────────────────────────────────────────

const StudentStatusOverview = () => {
  const { courses, fetchAllCourses } = useCourseStore();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Students
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [sortField, setSortField] = useState('completion');
  const [sortDir, setSortDir] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('allTime');

  useEffect(() => { fetchAllCourses(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) setSelectedCourseId(courses[0].id);
  }, [courses, selectedCourseId]);

  // Fetch analytics + students eagerly when course changes
  useEffect(() => {
    if (!selectedCourseId) return;
    setSearchQuery('');
    setStatusFilter('all');

    async function fetchAnalytics() {
      setIsLoading(true);
      try {
        const res = await api.get(`/api/courses/${selectedCourseId}/analytics`);
        setAnalytics(res.data);
      } catch (e) {
        console.error('Failed to fetch analytics', e);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchStudents() {
      setStudents([]);
      setStudentsLoading(true);
      try {
        const res = await api.get(`/api/courses/${selectedCourseId}/students`);
        setStudents(res.data?.students || []);
      } catch (e) {
        console.error('Failed to fetch students', e);
      } finally {
        setStudentsLoading(false);
      }
    }

    fetchAnalytics();
    fetchStudents();
  }, [selectedCourseId]);

  // Re-fetch leaderboard whenever course or period changes
  useEffect(() => {
    if (!selectedCourseId) return;

    async function fetchLeaderboard() {
      setLeaderboardLoading(true);
      try {
        const res = await api.get(`/api/progress/course/${selectedCourseId}/leaderboard?period=${leaderboardPeriod}`);
        setLeaderboard(res.data || []);
      } catch (e) {
        console.error('Failed to fetch leaderboard', e);
      } finally {
        setLeaderboardLoading(false);
      }
    }

    fetchLeaderboard();
  }, [selectedCourseId, leaderboardPeriod]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let av, bv;
      if (sortField === 'name') {
        av = a.student?.name?.toLowerCase() ?? '';
        bv = b.student?.name?.toLowerCase() ?? '';
      } else if (sortField === 'lastActivityDate') {
        av = a.lastActivityDate ? new Date(a.lastActivityDate).getTime() : 0;
        bv = b.lastActivityDate ? new Date(b.lastActivityDate).getTime() : 0;
      } else {
        av = a[sortField] ?? 0;
        bv = b[sortField] ?? 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDir]);

  const filteredStudents = useMemo(() => {
    return sortedStudents.filter(s => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        s.student?.name?.toLowerCase().includes(q) ||
        s.student?.email?.toLowerCase().includes(q);
      const badge = studentBadge(s);
      const matchesFilter = statusFilter === 'all' || badge.label === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [sortedStudents, searchQuery, statusFilter]);

  const metrics = useMemo(
    () => analytics?.metrics || { totalStudents: 0, avgCompletion: 0, activeModules: 0, totalXP: 0 },
    [analytics]
  );
  const atRisk = useMemo(() => analytics?.atRiskStudents || [], [analytics]);
  const conceptMastery = useMemo(() => analytics?.conceptMastery || [], [analytics]);

  const sortedConcepts = useMemo(
    () => [...conceptMastery].sort((a, b) => a.masteryLevel - b.masteryLevel),
    [conceptMastery]
  );

  const conceptStats = useMemo(() => {
    if (!conceptMastery.length) return null;
    const avg = Math.round(conceptMastery.reduce((s, c) => s + c.masteryLevel, 0) / conceptMastery.length);
    const excellent = conceptMastery.filter(c => c.masteryLevel > 85).length;
    const moderate = conceptMastery.filter(c => c.masteryLevel > 72 && c.masteryLevel <= 85).length;
    const poor = conceptMastery.filter(c => c.masteryLevel <= 72).length;
    return { avg, excellent, moderate, poor };
  }, [conceptMastery]);

  const avgStreak = useMemo(() => {
    if (!students.length) return 0;
    return Math.round(students.reduce((sum, s) => sum + (s.streak || 0), 0) / students.length);
  }, [students]);

  const retentionHealth = useMemo(
    () => metrics.totalStudents > 0 ? (1 - atRisk.length / metrics.totalStudents) * 100 : 100,
    [metrics, atRisk]
  );

  const healthScore = useMemo(() => {
    if (!analytics) return 0;
    return Math.round(metrics.avgCompletion * 0.6 + retentionHealth * 0.4);
  }, [analytics, metrics, retentionHealth]);

  const aiInsights = useMemo(() => analytics?.aiInsights || { alerts: [], successes: [] }, [analytics]);
  const hasInsights = (aiInsights.alerts?.length ?? 0) > 0 || (aiInsights.successes?.length ?? 0) > 0;

  const TABS = [
    {
      id: 'overview', label: 'Overview', icon: TrendingUp,
      badge: atRisk.length > 0 ? atRisk.length : null,
      badgeCls: 'bg-red-500 text-white',
    },
    {
      id: 'students', label: 'Students', icon: Users,
      badge: metrics.totalStudents || null,
      badgeCls: 'bg-indigo-500 text-white',
    },
    {
      id: 'concepts', label: 'Concepts', icon: Brain,
      badge: conceptMastery.length || null,
      badgeCls: 'bg-purple-500 text-white',
    },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const topXP = leaderboard.length > 0 ? (leaderboard[0].xp || 1) : 1;

  return (
    <InstructorLayout title="Student Status Overview">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(79,110,247,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative z-[1] space-y-8 p-4 sm:p-6 md:p-8 pb-32 max-w-[1600px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">
              Student Status Overview
            </h1>
            <p className="text-slate-600 dark:text-white/70 text-lg mt-2 font-medium leading-relaxed max-w-2xl">
              Track your students' progress, engagement, and mastery levels at a glance.
            </p>
          </div>
          <div className="relative w-full md:w-auto">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full md:min-w-[280px] bg-gradient-to-r from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-900 dark:text-white shadow-lg dark:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 appearance-none cursor-pointer transition-all"
              style={{
                WebkitAppearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238B5CF6' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left 1rem center',
                backgroundSize: '1.2em',
              }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Metric cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <MetricCard
            label="Total Students"
            value={metrics.totalStudents}
            subtitle={`${atRisk.length} at risk`}
            icon={<Users size={26} className="text-indigo-600 dark:text-indigo-400" />}
            glowColor="rgba(99,102,241,0.5)"
            trend={metrics.totalStudents > 0 ? 'up' : 'neutral'}
          />
          <MetricCard
            label="Avg. Completion"
            value={`${Math.round(metrics.avgCompletion)}%`}
            subtitle={metrics.avgCompletion >= 60 ? 'On track' : 'Needs focus'}
            icon={<TrendingUp size={26} className="text-emerald-600 dark:text-emerald-400" />}
            glowColor="rgba(16,185,129,0.5)"
            trend={metrics.avgCompletion >= 50 ? 'up' : 'down'}
          />
          <MetricCard
            label="Avg. Streak"
            value={`${avgStreak}d`}
            subtitle="days active in a row"
            icon={<Flame size={26} className="text-orange-500 dark:text-orange-400" />}
            glowColor="rgba(249,115,22,0.5)"
            trend={avgStreak >= 3 ? 'up' : avgStreak > 0 ? 'neutral' : 'down'}
          />
          <MetricCard
            label="Class XP"
            value={(metrics.totalXP || 0).toLocaleString()}
            subtitle={`Avg Lv.${levelFromXP(metrics.totalStudents > 0 ? Math.round(metrics.totalXP / metrics.totalStudents) : 0)}`}
            icon={<Zap size={26} className="text-amber-500 dark:text-amber-400" />}
            glowColor="rgba(245,158,11,0.5)"
            trend={metrics.totalXP > 0 ? 'up' : 'neutral'}
            badge="⚡ XP"
          />
        </div>

        {/* ── Tab switcher ── */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-white/5 dark:to-black/20 border border-slate-200/60 dark:border-white/10 p-2 rounded-3xl w-fit min-w-max backdrop-blur-sm">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-white to-slate-50/80 dark:from-white/15 dark:to-white/5 text-slate-900 dark:text-white shadow-lg dark:shadow-xl border border-slate-200/40 dark:border-white/20'
                      : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 hover:bg-white/30 dark:hover:bg-white/5 transition-colors'
                  }`}
                >
                  <TabIcon size={18} />
                  {tab.label}
                  {tab.badge != null && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${tab.badgeCls}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">

            {/* Class Health Score */}
            <ClassHealthScore
              score={isLoading ? 0 : healthScore}
              avgCompletion={metrics.avgCompletion}
              retentionHealth={retentionHealth}
              atRiskCount={atRisk.length}
              totalStudents={metrics.totalStudents}
              isLoading={isLoading}
            />

            {/* AI Insights */}
            {(isLoading || hasInsights) && (
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-6 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2 relative z-10">
                  <div className="p-1.5 rounded-xl bg-violet-100 dark:bg-violet-500/10">
                    <Star size={18} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  AI Insights
                </h3>
                <div className="space-y-2 relative z-10">
                  {isLoading ? (
                    <>
                      <div className="h-10 rounded-xl bg-slate-200 dark:bg-white/10 animate-pulse" />
                      <div className="h-10 rounded-xl bg-slate-200 dark:bg-white/10 animate-pulse w-4/5" />
                    </>
                  ) : (
                    <>
                      {aiInsights.alerts?.map((msg, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-500/8 border border-amber-200/60 dark:border-amber-500/20">
                          <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">{msg}</p>
                        </div>
                      ))}
                      {aiInsights.successes?.map((msg, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/8 border border-emerald-200/60 dark:border-emerald-500/20">
                          <CheckCircle size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">{msg}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Class Progress + right column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Class Progress table */}
              <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-8 relative z-10 drop-shadow-sm dark:drop-shadow-md flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10">
                    <BookOpen size={24} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  Class Progress
                </h3>
                <div className="relative z-10">
                  {isLoading ? (
                    <TableSkeleton cols={4} rows={5} />
                  ) : !analytics?.nodeProgress?.length ? (
                    <EmptyState icon={<BookOpen size={24} />} title="No modules yet" subtitle="Create course modules to see progress here." />
                  ) : (
                    <div className="overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 w-full max-h-[380px]">
                      <table className="w-full text-right text-sm border-collapse">
                        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-bold text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3 text-right">Module / Lesson</th>
                            <th className="px-5 py-3 text-right whitespace-nowrap">Class Progress</th>
                            <th className="px-5 py-3 text-right whitespace-nowrap">Completed</th>
                            <th className="px-5 py-3 text-right whitespace-nowrap">Difficulty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                          {analytics.nodeProgress.map((item, idx) => {
                            const total = metrics.totalStudents || 0;
                            const completed = item.students || 0;
                            const percentage = total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0;
                            const diff = difficultyFromPct(percentage);
                            const barGrad = completionBarGradient(percentage);
                            return (
                              <tr key={idx} className="hover:bg-slate-100/30 dark:hover:bg-white/3 transition-colors">
                                <td className="px-5 py-4 font-bold text-slate-800 dark:text-white drop-shadow-sm max-w-[220px]">
                                  <p className="truncate" title={item.name}>{item.name}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3 justify-end">
                                    <div className="w-24 bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden shadow-inner">
                                      <div className={`bg-gradient-to-r ${barGrad} h-full rounded-full`} style={{ width: `${percentage}%` }} />
                                    </div>
                                    <span className="text-xs font-black text-slate-700 dark:text-white/80 w-8 text-right">{percentage}%</span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 font-medium text-slate-600 dark:text-white/70 whitespace-nowrap">
                                  {completed} of {total}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${diff.color}`}>
                                    {diff.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <p className="mt-6 text-center text-xs text-slate-400 dark:text-white/40 font-bold relative z-10 uppercase tracking-wider">
                  Difficulty reflects actual class completion rate
                </p>
              </div>

              {/* Right column: Top Performers + At-Risk */}
              <div className="space-y-6">
                <TopPerformers leaderboard={leaderboard} loading={leaderboardLoading} />

                {/* At-Risk Panel */}
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-6 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center justify-between relative z-10">
                    <span className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-red-100 dark:bg-red-500/10">
                        <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                      </div>
                      At-Risk Students
                    </span>
                    <span className="bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-500/30 text-xs font-black px-3 py-1 rounded-full">
                      {atRisk.length}
                    </span>
                  </h3>
                  <div className="flex-1 space-y-2 relative z-10 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
                    {isLoading ? (
                      <CardSkeleton rows={3} />
                    ) : atRisk.length === 0 ? (
                      <EmptyState
                        icon={<Star size={18} className="text-emerald-500/60" />}
                        title="All clear!"
                        subtitle="No students at risk."
                        compact
                      />
                    ) : (
                      atRisk.map((item, i) => {
                        const iss = issueConfig(item.issue);
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                            <AvatarDisplay avatar={item.student?.avatar} size="w-9 h-9" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">
                                  {item.student?.name || 'Student'}
                                </p>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${iss.cls}`}>
                                  {iss.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 dark:text-white/40 mt-0.5">
                                {item.completion}% complete
                              </p>
                            </div>
                            <button
                              onClick={() => item.student?.email && window.open(`mailto:${item.student.email}`)}
                              disabled={!item.student?.email}
                              title={item.student?.email || 'No email'}
                              className="text-xs font-bold text-slate-700 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200/50 dark:border-white/5 px-2.5 py-1.5 rounded-xl transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Message
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STUDENTS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'students' && (
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white drop-shadow-sm flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/10">
                  <Users size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                All Students
              </h3>
              {students.length > 0 && (
                <span className="text-xs font-black text-slate-400 dark:text-white/40 uppercase tracking-wider">
                  {students.length} enrolled
                </span>
              )}
            </div>

            {/* Search + filter toolbar */}
            {students.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'On Track', 'At Risk', 'Not Started'].map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        statusFilter === f
                          ? f === 'At Risk'
                            ? 'bg-red-500 text-white shadow-sm'
                            : f === 'On Track'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : f === 'Not Started'
                            ? 'bg-slate-500 text-white shadow-sm'
                            : 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10'
                      }`}
                    >
                      {f === 'all' ? 'All' : f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative z-10">
              {studentsLoading ? (
                <TableSkeleton cols={9} rows={6} />
              ) : students.length === 0 ? (
                <EmptyState icon={<Users size={24} />} title="No students enrolled" subtitle="Students will appear here once they join." />
              ) : filteredStudents.length === 0 ? (
                <EmptyState icon={<Search size={24} />} title="No results" subtitle="Try a different search or filter." />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-right whitespace-nowrap w-12">#</th>
                        <SortableHeader field="name" label="Student" current={sortField} dir={sortDir} onSort={toggleSort} align="left" />
                        <th className="px-4 py-3 text-right whitespace-nowrap">Level</th>
                        <SortableHeader field="completion" label="Completion" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <SortableHeader field="totalXP" label="XP" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <SortableHeader field="completedNodes" label="Lessons" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <SortableHeader field="streak" label="Streak" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <SortableHeader field="lastActivityDate" label="Last Active" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <th className="px-4 py-3 text-right whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                      {filteredStudents.map((s, i) => {
                        const badge = studentBadge(s);
                        const rank = sortedStudents.indexOf(s) + 1;
                        const isTop3 = rank <= 3;
                        const isAtRisk = badge.label === 'At Risk';
                        const level = levelFromXP(s.totalXP);
                        const barGrad = completionBarGradient(s.completion);
                        const rowCls = isTop3
                          ? 'bg-amber-50/30 dark:bg-amber-500/5'
                          : isAtRisk
                          ? 'bg-red-50/20 dark:bg-red-500/4'
                          : '';
                        return (
                          <tr key={i} className={`hover:bg-slate-100/30 dark:hover:bg-white/3 transition-colors ${rowCls}`}>
                            {/* Rank */}
                            <td className="px-4 py-4 text-right">
                              {rank <= 3
                                ? <span className="text-lg select-none">{RANK_MEDAL[rank - 1]}</span>
                                : <span className="text-xs font-bold text-slate-400 dark:text-white/30">#{rank}</span>
                              }
                            </td>
                            {/* Name + avatar */}
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <AvatarDisplay avatar={s.student?.avatar} size="w-8 h-8" />
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-white leading-tight">{s.student?.name || 'Unknown'}</p>
                                  <p className="text-[11px] text-slate-400 dark:text-white/40 leading-tight">{s.student?.email || '—'}</p>
                                </div>
                              </div>
                            </td>
                            {/* Level */}
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/25 px-2 py-0.5 rounded-lg">
                                Lv.{level}
                              </span>
                            </td>
                            {/* Completion */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3 justify-end">
                                <div className="w-20 bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden shadow-inner">
                                  <div className={`bg-gradient-to-r ${barGrad} h-full rounded-full`} style={{ width: `${s.completion}%` }} />
                                </div>
                                <span className="text-xs font-black text-slate-700 dark:text-white/80 w-9 text-right">{s.completion}%</span>
                              </div>
                            </td>
                            {/* XP */}
                            <td className="px-4 py-4 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap">
                              <span className="text-amber-600 dark:text-amber-400">⚡</span> {(s.totalXP || 0).toLocaleString()}
                            </td>
                            {/* Lessons */}
                            <td className="px-4 py-4 text-right text-slate-600 dark:text-white/70 whitespace-nowrap font-medium">
                              {s.completedNodes} / {s.totalNodes}
                            </td>
                            {/* Streak */}
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <span className={`text-xs font-bold ${(s.streak || 0) > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-white/30'}`}>
                                {(s.streak || 0) > 0 ? `🔥 ${s.streak}d` : '—'}
                              </span>
                            </td>
                            {/* Last active */}
                            <td className="px-4 py-4 text-right text-slate-500 dark:text-white/50 whitespace-nowrap text-xs font-medium">
                              {relativeTime(s.lastActivityDate)}
                            </td>
                            {/* Status badge */}
                            <td className="px-4 py-4 text-right whitespace-nowrap">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${badge.color}`}>
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ CONCEPTS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'concepts' && (
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header + aggregate stats */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2 relative z-10">
              <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10">
                  <Brain size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                Curriculum Concept Mastery
              </h3>
              {conceptStats && (
                <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                  <span className="text-slate-500 dark:text-white/50 mr-1">
                    Avg: <span className="text-slate-900 dark:text-white">{conceptStats.avg}%</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    ✓ {conceptStats.excellent} excellent
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    ~ {conceptStats.moderate} moderate
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
                    ✗ {conceptStats.poor} poor
                  </span>
                </div>
              )}
            </div>
            {conceptStats && (
              <p className="text-xs text-slate-400 dark:text-white/40 font-medium mb-6 relative z-10 pl-1">
                Sorted by mastery — weakest concepts first
              </p>
            )}

            <div className="relative z-10">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                      <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-3/4" />
                      <div className="h-4 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-1/2" />
                    </div>
                  ))}
                </div>
              ) : sortedConcepts.length === 0 ? (
                <EmptyState icon={<Brain size={24} />} title="No concept data yet" subtitle="Generate a course curriculum to see mastery breakdown." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedConcepts.map((item, idx) => (
                    <ConceptCard key={idx} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ LEADERBOARD TAB ═══════════════════════════════════════════════════ */}
        {activeTab === 'leaderboard' && (
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
              <h3 className="font-display font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10">
                  <Trophy size={24} className="text-amber-600 dark:text-amber-400" />
                </div>
                Course Leaderboard
              </h3>
              {/* Period selector */}
              <div className="flex gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-1.5 rounded-2xl w-fit">
                {[
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'allTime', label: 'All Time' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setLeaderboardPeriod(p.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      leaderboardPeriod === p.id
                        ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-md border border-slate-200/60 dark:border-white/20'
                        : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative z-10">
              {leaderboardLoading ? (
                <TableSkeleton cols={5} rows={8} />
              ) : leaderboard.length === 0 ? (
                <EmptyState icon={<Trophy size={24} />} title="No leaderboard data" subtitle="Students need to earn XP for this period." />
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((s, i) => {
                    const rank = s.rank || i + 1;
                    const isTop3 = rank <= 3;
                    const level = s.level || levelFromXP(s.xp);
                    const xpBarWidth = Math.round(((s.xp || 0) / topXP) * 100);
                    const borderCls = rank === 1
                      ? 'border-amber-300/60 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/8'
                      : rank === 2
                      ? 'border-slate-300/60 dark:border-slate-400/25 bg-slate-50/80 dark:bg-white/5'
                      : rank === 3
                      ? 'border-orange-300/50 dark:border-orange-500/20 bg-orange-50/30 dark:bg-orange-500/5'
                      : 'border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-black/10';
                    return (
                      <div key={s.userId || i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.005] ${borderCls}`}>
                        {/* Rank */}
                        <div className="w-10 text-center flex-shrink-0">
                          {isTop3
                            ? <span className="text-2xl select-none">{RANK_MEDAL[rank - 1]}</span>
                            : <span className="text-sm font-black text-slate-400 dark:text-white/30">#{rank}</span>
                          }
                        </div>
                        {/* Avatar */}
                        <AvatarDisplay avatar={s.avatar} size="w-10 h-10" />
                        {/* Name + XP bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="font-bold text-slate-800 dark:text-white truncate leading-tight">{s.name || 'Student'}</p>
                            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/25 px-1.5 py-0.5 rounded flex-shrink-0">
                              Lv.{level}
                            </span>
                            {s.isYou && (
                              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 px-1.5 py-0.5 rounded flex-shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${
                                rank === 1 ? 'from-amber-400 to-yellow-300' :
                                rank === 2 ? 'from-slate-400 to-slate-300' :
                                rank === 3 ? 'from-orange-500 to-amber-400' :
                                'from-purple-500 to-indigo-400'
                              }`}
                              style={{ width: `${xpBarWidth}%`, boxShadow: isTop3 ? '0 0 8px rgba(251,191,36,0.4)' : 'none' }}
                            />
                          </div>
                        </div>
                        {/* XP */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-slate-900 dark:text-white text-sm">
                            <span className="text-amber-500 dark:text-amber-400">⚡</span> {(s.xp || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium">XP</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </InstructorLayout>
  );
};

// ── sub-components ─────────────────────────────────────────────────────────────

const MetricCard = ({ label, value, icon, glowColor, subtitle, trend, badge }) => (
  <div
    className="p-7 rounded-3xl flex flex-col justify-between cursor-default transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 relative overflow-hidden group"
    style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.04)' }}
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none"
      style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }}
    />
    <div className="flex justify-between items-start relative z-10">
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-white/10 dark:to-white/5 border border-slate-200/60 dark:border-white/10 shadow-sm">
        {icon}
      </div>
      {trend && trend !== 'neutral' && (
        <div className={`p-1.5 rounded-xl ${trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
          {trend === 'up'
            ? <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
            : <ChevronDown size={14} className="text-red-600 dark:text-red-400" />
          }
        </div>
      )}
    </div>
    <div className="relative z-10 mt-4">
      <p className="text-slate-400 dark:text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md leading-none">{value}</p>
        {badge && (
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 px-2 py-0.5 rounded-lg mb-0.5">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-400 dark:text-white/40 font-medium mt-1">{subtitle}</p>}
    </div>
  </div>
);

const SortableHeader = ({ field, label, current, dir, onSort, align = 'right' }) => {
  const active = current === field;
  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th
      className={`px-4 py-3 whitespace-nowrap text-${align} cursor-pointer select-none hover:text-slate-700 dark:hover:text-white/70 transition-colors`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon size={12} className={active ? 'text-purple-500' : 'opacity-40'} />
      </span>
    </th>
  );
};

const EmptyState = ({ icon, title, subtitle, compact = false }) => (
  <div className={`text-center text-slate-400 dark:text-white/40 font-medium flex flex-col items-center ${compact ? 'py-8' : 'py-12'}`}>
    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-400 dark:text-white/30">
      {icon}
    </div>
    <p className="font-bold text-slate-600 dark:text-white/50 text-sm">{title}</p>
    {subtitle && <p className="text-xs mt-1 text-slate-400 dark:text-white/30">{subtitle}</p>}
  </div>
);

export default StudentStatusOverview;
