import React from 'react';

const AdminStatCard = ({ label, value, icon, color = 'indigo' }) => (
    <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl bg-${color}-500/10 flex items-center justify-center text-xl shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{value?.toLocaleString() ?? '—'}</p>
            <p className="text-xs text-slate-500 dark:text-white/40 font-medium">{label}</p>
        </div>
    </div>
);

export default AdminStatCard;
