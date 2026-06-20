import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '../../utils/api';
import AdminStatCard from './AdminStatCard';

const ROLE_COLORS = {
    student: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    instructor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    admin: 'bg-red-500/10 border-red-500/20 text-red-400',
};

const OverviewTab = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/admin/stats')
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-white/40 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
        );
    }

    const roleMap = Object.fromEntries((data?.roleBreakdown ?? []).map(r => [r._id ?? 'none', r.count]));
    const statusMap = Object.fromEntries((data?.coursesByStatus ?? []).map(s => [s._id ?? 'unknown', s.count]));
    const maxStatus = Math.max(1, ...Object.values(statusMap));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AdminStatCard label="Total Users"          value={data?.totalUsers}         icon="👥" color="indigo"  />
                <AdminStatCard label="Total Courses"        value={data?.totalCourses}       icon="📚" color="purple"  />
                <AdminStatCard label="Total XP Awarded"     value={data?.totalXpAwarded}     icon="⚡" color="amber"   />
                <AdminStatCard label="Pending Enrollments"  value={data?.pendingEnrollments} icon="📋" color="emerald" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5">
                    <h3 className="font-black text-slate-800 dark:text-white text-sm mb-4">Users by Role</h3>
                    {Object.entries(roleMap).map(([role, count]) => (
                        <div key={role} className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className={`font-bold capitalize px-2 py-0.5 rounded-full border text-[10px] ${ROLE_COLORS[role] ?? 'text-white/50'}`}>
                                    {role || 'No role'}
                                </span>
                                <span className="text-slate-500 dark:text-white/40 font-bold">{count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(count / (data?.totalUsers || 1)) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5">
                    <h3 className="font-black text-slate-800 dark:text-white text-sm mb-4">Courses by Status</h3>
                    {Object.entries(statusMap).map(([status, count]) => (
                        <div key={status} className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-slate-600 dark:text-white/60 capitalize">{status}</span>
                                <span className="text-slate-500 dark:text-white/40 font-bold">{count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full bg-purple-500" style={{ width: `${(count / maxStatus) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OverviewTab;
