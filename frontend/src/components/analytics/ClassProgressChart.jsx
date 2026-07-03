import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import useSettingsStore from '../../store/settingsStore';
import Spinner from '../common/Spinner';

const ClassProgressChart = ({ data, isLoading }) => {
    const { theme } = useSettingsStore();
    const [isDark, setIsDark] = React.useState(false);

    React.useEffect(() => {
        const checkTheme = () => {
            if (theme === 'system') {
                setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
            } else {
                setIsDark(theme === 'dark');
            }
        };
        checkTheme();

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => checkTheme();
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [theme]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="h-64 w-full flex items-center justify-center">
                <Spinner label="Loading chart" />
            </div>
        );
    }

    // Show empty state if no data
    if (!data || data.length === 0) {
        return (
            <div className="h-64 w-full flex flex-col items-center justify-center text-slate-400 dark:text-white/40">
                <svg
                    className="w-16 h-16 mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
                <p className="font-bold text-slate-600 dark:text-white/60">No data available</p>
                <p className="text-sm mt-1">Create some course nodes to see progress</p>
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)'}
                    />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fontSize: 12,
                            fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                        }}
                        dy={10}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fontSize: 12,
                            fill: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
                        }}
                        label={{
                            value: 'Students',
                            angle: -90,
                            position: 'insideLeft',
                            style: {
                                fontSize: 12,
                                fill: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)',
                            },
                        }}
                    />
                    <Tooltip
                        cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.02)' }}
                        contentStyle={{
                            backgroundColor: isDark
                                ? 'rgba(15,23,42,0.9)'
                                : 'rgba(255,255,255,0.95)',
                            borderRadius: '12px',
                            border: isDark
                                ? '1px solid rgba(255,255,255,0.1)'
                                : '1px solid rgba(15,23,42,0.08)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            color: isDark ? 'white' : '#0f172a',
                        }}
                        itemStyle={{ color: isDark ? 'white' : '#0f172a', fontWeight: 'bold' }}
                        formatter={(value) => [`${value} students`, 'Enrolled']}
                    />
                    <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index % 2 === 0 ? '#8b5cf6' : '#6366f1'}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ClassProgressChart;
