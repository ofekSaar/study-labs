import React, { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import { Zap, TrendingUp } from 'lucide-react';
import api from '../../utils/api';

const DAYS_OPTIONS = [7, 14, 30];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const xp = payload[0]?.value || 0;
    if (xp === 0) return null;
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
            <p className="font-black text-slate-400 dark:text-white/40 mb-0.5">{label}</p>
            <p className="font-black text-amber-500 flex items-center gap-1">
                <Zap size={10} /> {xp.toLocaleString()} XP
            </p>
        </div>
    );
};

const XpHistoryChart = () => {
    const [history, setHistory] = useState([]);
    const [days, setDays] = useState(14);
    const [isLoading, setIsLoading] = useState(true);
    const [totalXp, setTotalXp] = useState(0);

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get(`/api/progress/xp-history?days=${days}`);
                const raw = data.history || [];
                setHistory(
                    raw.map((d) => ({
                        date: new Date(d.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                        }),
                        xp: d.xp,
                    }))
                );
                setTotalXp(raw.reduce((s, d) => s + d.xp, 0));
            } catch {
                setHistory([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [days]);

    return (
        <div className="glass-card rounded-3xl p-5 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <TrendingUp size={15} className="text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                            XP Progress
                        </h3>
                        <p className="text-[10px] text-slate-400 dark:text-white/35 font-medium">
                            {totalXp.toLocaleString()} XP earned in {days} days
                        </p>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-0.5 gap-0.5 border border-slate-200/50 dark:border-white/8">
                    {DAYS_OPTIONS.map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${
                                days === d
                                    ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-300 shadow-sm'
                                    : 'text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60'
                            }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-40">
                {isLoading ? (
                    <div className="h-full rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={history}
                            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                            <XAxis
                                dataKey="date"
                                tick={{
                                    fontSize: 9,
                                    fill: 'rgba(148,163,184,0.7)',
                                    fontWeight: 700,
                                }}
                                interval={Math.floor(history.length / 4)}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{
                                    fontSize: 9,
                                    fill: 'rgba(148,163,184,0.7)',
                                    fontWeight: 700,
                                }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="xp"
                                stroke="#F59E0B"
                                strokeWidth={2.5}
                                fill="url(#xpGrad)"
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: '#F59E0B',
                                    stroke: '#fff',
                                    strokeWidth: 2,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};

export default XpHistoryChart;
