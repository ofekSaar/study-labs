import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Users, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

function SummaryCard({ icon, label, value, accent = 'orange' }) {
  const ACCENT = {
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    blue:   'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    green:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  };
  return (
    <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ACCENT[accent]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-800 dark:text-white">{value ?? '—'}</p>
      </div>
    </div>
  );
}

const InstructorsTab = () => {
  const [instructors, setInstructors] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInstructors = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const res = await api.get(`/api/admin/instructors?${params}`);
      setInstructors(res.data.instructors);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchInstructors(''); }, []); // eslint-disable-line

  const handleSearch = e => {
    e.preventDefault();
    fetchInstructors(search);
  };

  const totalCourses = instructors.reduce((s, i) => s + (i.stats?.totalCourses ?? 0), 0);
  const totalStudents = instructors.reduce((s, i) => s + (i.stats?.totalStudents ?? 0), 0);
  const avgCourses = total > 0 ? (totalCourses / total).toFixed(1) : '—';

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<Users size={16} />} label="Total Instructors" value={total} accent="orange" />
        <SummaryCard icon={<BookOpen size={16} />} label="Total Courses" value={totalCourses} accent="blue" />
        <SummaryCard icon={<GraduationCap size={16} />} label="Total Students" value={totalStudents} accent="green" />
        <SummaryCard icon={<GraduationCap size={16} />} label="Avg. Courses / Instructor" value={avgCourses} accent="purple" />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:border-orange-500"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-400 transition">
          Search
        </button>
      </form>

      <p className="text-xs text-slate-500 dark:text-white/30 font-medium">{total} instructor{total !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 dark:text-white/40 text-sm py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : instructors.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-white/30 text-sm">
          No instructors found
        </div>
      ) : (
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 dark:border-white/[0.06]">
                  {['Instructor', 'Courses', 'Students', 'Success Rate', 'Joined'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 dark:text-white/25 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-white/[0.04]">
                {instructors.map(inst => (
                  <tr key={inst._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {inst.avatar ? (
                          <img src={inst.avatar} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 font-black text-sm">
                            {inst.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 dark:text-white truncate">{inst.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-white/30 truncate">{inst.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={13} className="text-slate-400 dark:text-white/30" />
                        <span className="font-bold text-slate-700 dark:text-white/70">{inst.stats?.totalCourses ?? 0}</span>
                        {inst.stats?.failedCourses > 0 && (
                          <span className="text-[10px] text-red-400 font-medium">({inst.stats.failedCourses} failed)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-slate-400 dark:text-white/30" />
                        <span className="font-bold text-slate-700 dark:text-white/70">{inst.stats?.totalStudents ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {inst.stats?.successRate != null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${inst.stats.successRate >= 80 ? 'bg-emerald-500' : inst.stats.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${inst.stats.successRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-white/50">{inst.stats.successRate}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 dark:text-white/30">
                      {new Date(inst.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorsTab;
