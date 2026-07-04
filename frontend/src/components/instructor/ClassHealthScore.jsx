import React from 'react';
import { Users, TrendingUp, Activity, AlertTriangle } from 'lucide-react';

const HealthIndicator = ({ label, value, color, icon }) => (
    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5">
        <span
            className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${color}`}
        >
            {icon}
            {label}
        </span>
        <span className="text-2xl font-black text-slate-900 dark:text-white">{value}</span>
    </div>
);

/** Hero widget summarising class engagement, completion & retention. */
const ClassHealthScore = ({
    score,
    avgCompletion,
    retentionHealth,
    atRiskCount,
    totalStudents,
    isLoading,
}) => {
    const r = 56;
    const circ = 2 * Math.PI * r;
    const filled = (Math.min(score, 100) / 100) * circ;
    const ringColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Needs Attention' : 'At Risk';
    const labelColor =
        score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500';

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
                                <circle
                                    cx="70"
                                    cy="70"
                                    r={r}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="14"
                                    className="text-slate-100 dark:text-white/8"
                                />
                                <circle
                                    cx="70"
                                    cy="70"
                                    r={r}
                                    fill="none"
                                    stroke={ringColor}
                                    strokeWidth="14"
                                    strokeDasharray={`${filled} ${circ}`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 70 70)"
                                    style={{
                                        transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)',
                                        filter: `drop-shadow(0 0 10px ${ringColor}60)`,
                                    }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                                <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                                    {score}
                                </span>
                                <span
                                    className={`text-[10px] font-black uppercase tracking-widest mt-1 ${labelColor}`}
                                >
                                    {label}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Label + indicators */}
                <div className="flex-1">
                    <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white mb-1">
                        Class Health Score
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-white/50 mb-6">
                        Overall snapshot of engagement, completion &amp; retention
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <HealthIndicator
                            label="Avg Completion"
                            value={`${Math.round(avgCompletion)}%`}
                            color="text-indigo-500"
                            icon={<TrendingUp size={14} />}
                        />
                        <HealthIndicator
                            label="Retention Rate"
                            value={`${Math.round(retentionHealth)}%`}
                            color="text-emerald-500"
                            icon={<Activity size={14} />}
                        />
                        <HealthIndicator
                            label="At-Risk Students"
                            value={atRiskCount}
                            color="text-red-500"
                            icon={<AlertTriangle size={14} />}
                        />
                        <HealthIndicator
                            label="Total Students"
                            value={totalStudents}
                            color="text-purple-500"
                            icon={<Users size={14} />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassHealthScore;
