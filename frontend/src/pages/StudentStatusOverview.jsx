import React, { useEffect, useState, useMemo } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import {
  Users, BookOpen, Trophy, TrendingUp, Brain,
  ChevronUp, ChevronDown, ChevronsUpDown,
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

// ── main component ─────────────────────────────────────────────────────────────

const StudentStatusOverview = () => {
  const { courses, fetchAllCourses } = useCourseStore();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Students tab
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [sortField, setSortField] = useState('completion');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => { fetchAllCourses(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) setSelectedCourseId(courses[0].id);
  }, [courses, selectedCourseId]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedCourseId) { setIsLoading(false); return; }
      setIsLoading(true);
      try {
        const res = await api.get(`/api/courses/${selectedCourseId}/analytics`);
        setAnalytics(res.data);
      } catch (e) {
        console.error('Failed to fetch analytics', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedCourseId]);

  useEffect(() => {
    setStudents([]);
    if (activeTab !== 'students' || !selectedCourseId) return;
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const res = await api.get(`/api/courses/${selectedCourseId}/students`);
        setStudents(res.data?.students || []);
      } catch (e) {
        console.error('Failed to fetch students', e);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [activeTab, selectedCourseId]);

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

  const metrics = analytics?.metrics || { totalStudents: 0, avgCompletion: 0, activeModules: 0, totalXP: 0 };
  const atRisk = analytics?.atRiskStudents || [];
  const conceptMastery = analytics?.conceptMastery || [];

  const TABS = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'concepts', label: 'Concepts', icon: Brain },
  ];

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

      <div className="relative z-[1] space-y-6 p-4 sm:p-6 md:p-8 pb-32 max-w-[1600px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">
              Student Status Overview
            </h1>
            <p className="text-slate-500 dark:text-white/60 text-lg mt-1 font-medium">
              Track your students' progress, engagement, and mastery levels.
            </p>
          </div>
          <div className="relative w-full md:w-auto">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full md:min-w-[200px] bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm font-bold text-slate-700 dark:text-white shadow-inner focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
              style={{
                WebkitAppearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238B5CF6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left 1rem center',
                backgroundSize: '1em',
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Students" value={metrics.totalStudents} icon={<Users size={24} className="text-indigo-600 dark:text-indigo-400 drop-shadow-sm dark:drop-shadow-md" />} glowColor="rgba(99,102,241,0.5)" />
          <MetricCard label="Avg. Completion" value={`${Math.round(metrics.avgCompletion)}%`} icon={<TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400 drop-shadow-sm dark:drop-shadow-md" />} glowColor="rgba(16,185,129,0.5)" />
          <MetricCard label="Active Modules" value={metrics.activeModules} icon={<BookOpen size={24} className="text-purple-600 dark:text-purple-400 drop-shadow-sm dark:drop-shadow-md" />} glowColor="rgba(124,58,237,0.5)" />
          <MetricCard label="Class XP" value={(metrics.totalXP || 0).toLocaleString()} icon={<Trophy size={24} className="text-orange-600 dark:text-orange-400 drop-shadow-sm dark:drop-shadow-md" />} glowColor="rgba(245,158,11,0.5)" />
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex gap-1 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-1 rounded-2xl w-fit">
          {TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'
              }`}
            >
              <TabIcon size={15} />
              {tab.label}
            </button>
          );
        })}
        </div>

        {/* ══ OVERVIEW TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Class Progress table */}
            <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-6 relative z-10 drop-shadow-sm dark:drop-shadow-md">
                Class Progress
              </h3>
              <div className="relative z-10">
                {isLoading ? (
                  <TableSkeleton cols={4} rows={5} />
                ) : !analytics?.nodeProgress?.length ? (
                  <EmptyState
                    icon={<BookOpen size={24} />}
                    title="No modules yet"
                    subtitle="Create course modules to see progress here."
                  />
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 w-full">
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
                          return (
                            <tr key={idx} className="hover:bg-slate-100/30 dark:hover:bg-white/3 transition-colors">
                              <td className="px-5 py-4 font-bold text-slate-800 dark:text-white drop-shadow-sm">{item.name}</td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3 justify-end">
                                  <div className="w-24 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden shadow-inner">
                                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
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

            {/* At-Risk Panel */}
            <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-6 flex items-center justify-between relative z-10 drop-shadow-sm dark:drop-shadow-md">
                <span>At-Risk Students</span>
                <span className="bg-red-500/10 text-red-500 border border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 text-xs px-3 py-1 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                  {atRisk.length}
                </span>
              </h3>
              <div className="flex-1 space-y-3 relative z-10 overflow-y-auto max-h-[340px] pr-1 custom-scrollbar">
                {isLoading ? (
                  <CardSkeleton rows={3} />
                ) : atRisk.length === 0 ? (
                  <EmptyState
                    icon={<Trophy size={20} className="text-emerald-500/60" />}
                    title="All clear!"
                    subtitle="No students at risk currently."
                    compact
                  />
                ) : (
                  atRisk.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                      {item.student?.avatar && (item.student.avatar.startsWith('http') || item.student.avatar.startsWith('/')) ? (
                        <img src={item.student.avatar} alt="Avatar" className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-lg flex-shrink-0 select-none">
                          {item.student?.avatar || '🎓'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate drop-shadow-sm leading-tight">
                          {item.student?.name || 'Student'}
                        </p>
                        <p className="text-[11px] text-red-500 dark:text-red-400 font-medium mt-0.5 truncate leading-tight">
                          {item.issue === 'Never started' ? 'Has not started yet' :
                           item.issue?.startsWith('Inactive for') ? `Inactive for ${item.issue.split(' ')[2]} days` :
                           item.issue === 'Low progress' ? 'Low progress rate' :
                           item.issue}
                        </p>
                      </div>
                      <button
                        onClick={() => item.student?.email && window.open(`mailto:${item.student.email}`)}
                        disabled={!item.student?.email}
                        title={item.student?.email ? `Email ${item.student.name}` : 'No email available'}
                        className="text-xs font-bold text-slate-700 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200/50 dark:border-white/5 px-3 py-2 rounded-xl transition-colors shadow-inner flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Message
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ STUDENTS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'students' && (
          <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md">
                All Students
              </h3>
              {students.length > 0 && (
                <span className="text-xs font-black text-slate-400 dark:text-white/40 uppercase tracking-wider">
                  {students.length} enrolled
                </span>
              )}
            </div>
            <div className="relative z-10">
              {studentsLoading ? (
                <TableSkeleton cols={6} rows={6} />
              ) : students.length === 0 ? (
                <EmptyState
                  icon={<Users size={24} />}
                  title="No students enrolled"
                  subtitle="Students will appear here once they join the course."
                />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <SortableHeader field="name" label="Student" current={sortField} dir={sortDir} onSort={toggleSort} align="left" />
                        <SortableHeader field="completion" label="Completion" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <SortableHeader field="totalXP" label="XP" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <SortableHeader field="completedNodes" label="Lessons" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <SortableHeader field="lastActivityDate" label="Last Active" current={sortField} dir={sortDir} onSort={toggleSort} />
                        <th className="px-5 py-3 text-right whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                      {sortedStudents.map((s, i) => {
                        const badge = studentBadge(s);
                        return (
                          <tr key={i} className="hover:bg-slate-100/30 dark:hover:bg-white/3 transition-colors">
                            {/* Name + avatar */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {s.student?.avatar && (s.student.avatar.startsWith('http') || s.student.avatar.startsWith('/')) ? (
                                  <img src={s.student.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex-shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-base flex-shrink-0 select-none">
                                    {s.student?.avatar || '🎓'}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-800 dark:text-white leading-tight">{s.student?.name || 'Unknown'}</p>
                                  <p className="text-[11px] text-slate-400 dark:text-white/40 leading-tight">{s.student?.email || '—'}</p>
                                </div>
                              </div>
                            </td>
                            {/* Completion */}
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3 justify-end">
                                <div className="w-20 bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden shadow-inner">
                                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${s.completion}%` }} />
                                </div>
                                <span className="text-xs font-black text-slate-700 dark:text-white/80 w-9 text-right">{s.completion}%</span>
                              </div>
                            </td>
                            {/* XP */}
                            <td className="px-5 py-4 text-right font-bold text-slate-800 dark:text-white whitespace-nowrap">
                              {(s.totalXP || 0).toLocaleString()} <span className="text-slate-400 dark:text-white/40 font-medium">XP</span>
                            </td>
                            {/* Lessons */}
                            <td className="px-5 py-4 text-right text-slate-600 dark:text-white/70 whitespace-nowrap font-medium">
                              {s.completedNodes} / {s.totalNodes}
                            </td>
                            {/* Last active */}
                            <td className="px-5 py-4 text-right text-slate-500 dark:text-white/50 whitespace-nowrap text-xs font-medium">
                              {relativeTime(s.lastActivityDate)}
                            </td>
                            {/* Status badge */}
                            <td className="px-5 py-4 text-right whitespace-nowrap">
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
          <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-6 relative z-10 drop-shadow-sm dark:drop-shadow-md flex items-center gap-2">
              <Brain size={22} className="text-purple-600 dark:text-purple-400" />
              Curriculum Concept Mastery
            </h3>
            <div className="relative z-10 space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
                    <div className="h-4 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-1/3 mb-3" />
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                  </div>
                ))
              ) : conceptMastery.length === 0 ? (
                <EmptyState
                  icon={<Brain size={24} />}
                  title="No concept data yet"
                  subtitle="Generate a course curriculum to see mastery breakdown."
                />
              ) : (
                conceptMastery.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate drop-shadow-sm">{item.topic}</p>
                      <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full mt-2 overflow-hidden shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.masteryLevel > 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                            item.masteryLevel > 72 ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                            'bg-gradient-to-r from-red-500 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          }`}
                          style={{ width: `${item.masteryLevel}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-black text-slate-800 dark:text-white">{item.masteryLevel}%</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                        item.status === 'Excellent' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' :
                        item.status === 'Moderate' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' :
                        'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </InstructorLayout>
  );
};

// ── sub-components ─────────────────────────────────────────────────────────────

const MetricCard = ({ label, value, icon, glowColor }) => (
  <div
    className="p-5 rounded-3xl flex flex-col justify-between h-36 cursor-default transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_16px_32px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.5)] bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 relative overflow-hidden group"
    style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}
  >
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
      style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }}
    />
    <div className="flex justify-between items-start relative z-10">
      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5 shadow-inner">
        {icon}
      </div>
    </div>
    <div className="relative z-10">
      <p className="text-slate-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md">{value}</p>
    </div>
  </div>
);

const SortableHeader = ({ field, label, current, dir, onSort, align = 'right' }) => {
  const active = current === field;
  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th
      className={`px-5 py-3 whitespace-nowrap text-${align} cursor-pointer select-none hover:text-slate-700 dark:hover:text-white/70 transition-colors`}
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
