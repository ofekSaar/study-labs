import React from 'react';
import { TrendingUp, ChevronDown } from 'lucide-react';

/** KPI tile with icon, value, optional trend arrow / badge / subtitle. */
const MetricCard = ({ label, value, icon, glowColor, subtitle, trend, badge }) => (
    <div
        className="p-7 rounded-3xl flex flex-col justify-between cursor-default transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] bg-gradient-to-br from-white to-slate-50 dark:from-white/8 dark:to-white/3 border border-slate-200/80 dark:border-white/15 relative overflow-hidden group"
        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.04)' }}
    >
        <div
            className="absolute inset-0 opacity-0 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none"
            style={{
                background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
            }}
        />
        <div className="flex justify-between items-start relative z-10">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-white/10 dark:to-white/5 border border-slate-200/60 dark:border-white/10 shadow-sm">
                {icon}
            </div>
            {trend && trend !== 'neutral' && (
                <div
                    className={`p-1.5 rounded-xl ${trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}
                >
                    {trend === 'up' ? (
                        <TrendingUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <ChevronDown size={14} className="text-red-600 dark:text-red-400" />
                    )}
                </div>
            )}
        </div>
        <div className="relative z-10 mt-4">
            <p className="text-slate-400 dark:text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">
                {label}
            </p>
            <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md leading-none">
                    {value}
                </p>
                {badge && (
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25 px-2 py-0.5 rounded-lg mb-0.5">
                        {badge}
                    </span>
                )}
            </div>
            {subtitle && (
                <p className="text-xs text-slate-400 dark:text-white/40 font-medium mt-1">
                    {subtitle}
                </p>
            )}
        </div>
    </div>
);

export default MetricCard;
