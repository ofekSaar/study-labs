import React, { useEffect, useState } from 'react';
import { BarChart2, CheckCircle, XCircle, Clock, Users, BookOpen, Zap, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import InstructorLayout from '../components/layout/InstructorLayout';
import api from '../utils/api';

const STATUS_STYLES = {
  ready:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  failed:     'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  generating: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  pending:    'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
};

const STATUS_LABELS = {
  ready: 'Ready',
  failed: 'Failed',
  generating: 'Generating',
  pending: 'Pending',
};

const DEPT_LABELS = {
  cs: 'CS', math: 'Math', physics: 'Physics', bio: 'Biology', other: 'Other',
};

function StatCard({ icon, label, value, sub, accent = 'blue' }) {
  const ACCENT = {
    blue:   'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    green:  'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    red:    'text-red-600 dark:text-red-400 bg-red-500/10',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-500/10',
  };
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5 flex gap-4 items-start">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ACCENT[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-white/40 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-white/30 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <h2 className="text-xs font-black text-slate-400 dark:text-white/25 uppercase tracking-widest mb-3 mt-6">
      {title}
    </h2>
  );
}

function formatDuration(ms) {
  if (ms == null) return '—';
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <BarChart2 size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white">Statistics</h1>
            <p className="text-xs text-slate-400 dark:text-white/30">Overview of your courses and students</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400 dark:text-white/30 gap-2">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-sm">Loading statistics…</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {data && (() => {
          const { generation, enrollments, content, engagement, recentCourses } = data;
          return (
            <>
              {/* Generation Health */}
              <SectionHeader title="Course Generation" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={<BarChart2 size={18} />}
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
                />
                <StatCard
                  icon={<Clock size={18} />}
                  label="Avg. Generation Time"
                  value={formatDuration(generation.avgGenerationMs)}
                  sub={generation.avgGenerationMs ? 'per successful course' : 'no data yet'}
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
              <SectionHeader title="Student Engagement" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                />
                <StatCard
                  icon={<Zap size={18} />}
                  label="Avg. Completion"
                  value={engagement.avgCompletionRate != null ? `${engagement.avgCompletionRate}%` : '—'}
                  sub="across enrolled students"
                  accent="orange"
                />
              </div>

              {/* Content */}
              <SectionHeader title="Content Created" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={<BookOpen size={18} />}
                  label="Total Nodes"
                  value={content.totalNodes}
                  accent="blue"
                />
                <StatCard
                  icon={<BookOpen size={18} />}
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
                  label="Avg. Nodes / Course"
                  value={content.avgNodesPerCourse || '—'}
                  accent="green"
                />
              </div>

              {/* Recent Courses Table */}
              <SectionHeader title="Recent Courses" />
              <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl overflow-hidden">
                {recentCourses.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 dark:text-white/30 text-sm">
                    No courses yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200/60 dark:border-white/[0.06]">
                          {['Course', 'Dept', 'Status', 'Gen. Time', 'Students', 'Created'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 dark:text-white/25 uppercase tracking-widest">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/40 dark:divide-white/[0.04]">
                        {recentCourses.map(course => {
                          const genMs = course.generationStartedAt && course.generationCompletedAt
                            ? new Date(course.generationCompletedAt) - new Date(course.generationStartedAt)
                            : null;
                          return (
                            <tr key={course._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800 dark:text-white truncate max-w-[200px]">{course.title}</p>
                                {course.generationError && (
                                  <p className="text-[10px] text-red-400 truncate max-w-[200px] mt-0.5">{course.generationError}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-500 dark:text-white/40 text-xs font-medium">
                                {DEPT_LABELS[course.department] ?? course.department}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[course.generationStatus]}`}>
                                  {STATUS_LABELS[course.generationStatus] ?? course.generationStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-white/50 font-medium">
                                {formatDuration(genMs)}
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-white/50 font-medium">
                                {course.studentCount ?? 0}
                              </td>
                              <td className="px-4 py-3 text-slate-400 dark:text-white/30 text-xs">
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
