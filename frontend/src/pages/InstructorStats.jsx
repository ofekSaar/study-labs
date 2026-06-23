import React, { useEffect, useState } from 'react';
import {
  BarChart2, CheckCircle, Clock, Users, BookOpen, Zap,
  TrendingUp, RefreshCw, AlertCircle, Trophy, Star, Target,
  Flame, Award, Shield, GraduationCap, Pencil,
} from 'lucide-react';
import InstructorLayout from '../components/layout/InstructorLayout';
import api from '../utils/api';

const STATUS_STYLES = {
  ready:      'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  failed:     'bg-red-500/15 text-red-500 border-red-500/30',
  generating: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  pending:    'bg-slate-500/15 text-slate-500 border-slate-400/30',
};

const STATUS_LABELS = {
  ready: 'Ready', failed: 'Failed', generating: 'Generating', pending: 'Pending',
};

const DEPT_LABELS = {
  cs: 'CS', math: 'Math', physics: 'Physics', bio: 'Biology', other: 'Other',
};

function formatDuration(ms) {
  if (ms == null) return '—';
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
}

const ACCENTS = {
  blue:   { bg: 'bg-blue-500/10',   icon: 'text-blue-500',   bar: 'bg-blue-500',   glow: 'shadow-blue-500/20',   border: 'border-blue-500/20' },
  green:  { bg: 'bg-emerald-500/10', icon: 'text-emerald-500', bar: 'bg-emerald-500', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/20' },
  purple: { bg: 'bg-purple-500/10',  icon: 'text-purple-500',  bar: 'bg-purple-500',  glow: 'shadow-purple-500/20',  border: 'border-purple-500/20' },
  orange: { bg: 'bg-orange-500/10',  icon: 'text-orange-500',  bar: 'bg-orange-500',  glow: 'shadow-orange-500/20',  border: 'border-orange-500/20' },
  red:    { bg: 'bg-red-500/10',     icon: 'text-red-500',     bar: 'bg-red-500',     glow: 'shadow-red-500/20',     border: 'border-red-500/20' },
};

function StatCard({ icon, label, value, sub, accent = 'blue', progress, highlight }) {
  const a = ACCENTS[accent];
  return (
    <div className={`relative bg-white border rounded-2xl p-5 flex flex-col gap-3 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${a.border} ${highlight ? `shadow-md ${a.glow}` : 'border-slate-100 shadow-sm'}`}>
      {/* top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${a.bar} opacity-60`} />

      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.bg}`}>
          <span className={a.icon}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
          <p className="text-2xl font-black text-slate-800 leading-none">{value ?? '—'}</p>
          {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        </div>
      </div>

      {progress != null && (
        <div className="w-full">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${a.bar} rounded-full transition-all duration-700`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, color = 'purple' }) {
  const colors = {
    purple: 'text-purple-600 bg-purple-500/10',
    blue:   'text-blue-600 bg-blue-500/10',
    orange: 'text-orange-600 bg-orange-500/10',
  };
  return (
    <div className="flex items-center gap-2.5 mb-4 mt-8">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <h2 className="text-sm font-black text-slate-600 uppercase tracking-widest">{title}</h2>
    </div>
  );
}

function HeroBanner({ generation, enrollments, engagement }) {
  const xp = (generation.readyCourses * 200) + (enrollments.totalStudents * 50) + (engagement.avgCompletionRate ?? 0);
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const levelXp = xp % 500;

  return (
    <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-xl shadow-purple-500/25 p-6 sm:p-8">
      {/* decorative circles */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5" />
      <div className="absolute top-4 right-24 w-16 h-16 rounded-full bg-white/5" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Level badge */}
        <div className="flex-shrink-0">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <div className="w-full h-full rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex flex-col items-center justify-center gap-0.5 shadow-lg">
              <Trophy size={22} className="text-yellow-300" />
              <span className="text-xl sm:text-2xl font-black text-white">Lv.{level}</span>
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
              <Star size={12} className="text-yellow-900 fill-yellow-900" />
            </div>
          </div>
        </div>

        {/* Title + XP bar */}
        <div className="flex-1 min-w-0">
          <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Instructor Dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
            Statistics Overview
          </h1>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700"
                style={{ width: `${(levelXp / 500) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-yellow-300 whitespace-nowrap">{levelXp} / 500 XP</span>
          </div>
          <p className="text-purple-200 text-xs">Total XP: {xp.toLocaleString()}</p>
        </div>

        {/* Quick stats */}
        <div className="flex sm:flex-col gap-3 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <Flame size={14} className="text-orange-300" />
            <span className="text-sm font-bold text-white">{generation.readyCourses} courses</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <Users size={14} className="text-blue-300" />
            <span className="text-sm font-bold text-white">{enrollments.totalStudents} students</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const InstructorStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/instructor/stats');
        setData(res.data);
      } catch (e) {
        setError(e.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <InstructorLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {loading && (
          <div className="flex items-center justify-center py-32 text-slate-400 gap-3">
            <RefreshCw size={20} className="animate-spin text-purple-500" />
            <span className="text-sm font-medium">Loading statistics…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-600 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {data && (() => {
          const { generation, enrollments, content, engagement, recentCourses } = data;
          return (
            <>
              <HeroBanner generation={generation} enrollments={enrollments} engagement={engagement} />

              {/* Course Generation */}
              <SectionHeader icon={<Target size={14} />} title="Course Generation" color="purple" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={<GraduationCap size={18} />}
                  label="Total Courses"
                  value={generation.totalCourses}
                  accent="blue"
                />
                <StatCard
                  icon={<CheckCircle size={18} />}
                  label="Success Rate"
                  value={generation.totalCourses > 0 ? `${generation.successRate}%` : '—'}
                  sub={`${generation.readyCourses} of ${generation.totalCourses} ready`}
                  accent="green"
                  progress={generation.successRate}
                  highlight={generation.successRate === 100}
                />
                <StatCard
                  icon={<Clock size={18} />}
                  label="Avg. Gen. Time"
                  value={formatDuration(generation.avgGenerationMs)}
                  sub={generation.avgGenerationMs ? 'per course' : 'no data yet'}
                  accent="purple"
                />
                <StatCard
                  icon={<RefreshCw size={18} />}
                  label="Total Attempts"
                  value={generation.totalAttempts}
                  sub={`${generation.failedCourses} failed`}
                  accent={generation.failedCourses > 0 ? 'red' : 'blue'}
                />
              </div>

              {/* Student Engagement */}
              <SectionHeader icon={<Users size={14} />} title="Student Engagement" color="blue" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  icon={<Users size={18} />}
                  label="Total Students"
                  value={enrollments.totalStudents}
                  sub="approved enrollments"
                  accent="blue"
                />
                <StatCard
                  icon={<TrendingUp size={18} />}
                  label="Approval Rate"
                  value={enrollments.approvalRate != null ? `${enrollments.approvalRate}%` : '—'}
                  sub={`${enrollments.pendingEnrollments} pending`}
                  accent="green"
                  progress={enrollments.approvalRate}
                />
                <StatCard
                  icon={<Zap size={18} />}
                  label="Avg. Completion"
                  value={engagement.avgCompletionRate != null ? `${engagement.avgCompletionRate}%` : '—'}
                  sub="across enrolled students"
                  accent="orange"
                  progress={engagement.avgCompletionRate}
                />
              </div>

              {/* Content Created */}
              <SectionHeader icon={<Award size={14} />} title="Content Created" color="orange" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={<BookOpen size={18} />}
                  label="Total Nodes"
                  value={content.totalNodes}
                  accent="blue"
                />
                <StatCard
                  icon={<Shield size={18} />}
                  label="Lessons"
                  value={content.totalLessons}
                  accent="purple"
                />
                <StatCard
                  icon={<Zap size={18} />}
                  label="Quizzes"
                  value={content.totalQuizzes}
                  accent="orange"
                />
                <StatCard
                  icon={<BarChart2 size={18} />}
                  label="Nodes / Course"
                  value={content.avgNodesPerCourse || '—'}
                  accent="green"
                />
                <StatCard
                  icon={<Pencil size={18} />}
                  label="Question Edits"
                  value={content.totalQuestionEdits ?? 0}
                  sub="manual quiz edits"
                  accent="purple"
                />
              </div>

              {/* Recent Courses */}
              <SectionHeader icon={<Star size={14} />} title="Recent Courses" color="purple" />
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                {recentCourses.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">
                    No courses yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Course', 'Dept', 'Status', 'Gen. Time', 'Students', 'Created'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {recentCourses.map(course => {
                          const genMs = course.generationStartedAt && course.generationCompletedAt
                            ? new Date(course.generationCompletedAt) - new Date(course.generationStartedAt)
                            : null;
                          return (
                            <tr key={course._id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3.5">
                                <p className="font-bold text-slate-800 truncate max-w-[200px]">{course.title}</p>
                                {course.generationError && (
                                  <p className="text-[10px] text-red-400 truncate max-w-[200px] mt-0.5">{course.generationError}</p>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {DEPT_LABELS[course.department] ?? course.department}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${STATUS_STYLES[course.generationStatus]}`}>
                                  {STATUS_LABELS[course.generationStatus] ?? course.generationStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-600 font-semibold text-xs">
                                {formatDuration(genMs)}
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <Users size={12} className="text-slate-400" />
                                  <span className="text-slate-700 font-semibold text-xs">{course.studentCount ?? 0}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-slate-400 text-xs">
                                {new Date(course.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </InstructorLayout>
  );
};

export default InstructorStats;
