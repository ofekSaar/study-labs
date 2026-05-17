import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ClassProgressChart = ({ data, isLoading }) => {
    // Show loading state
    if (isLoading) {
        return (
            <div className="h-64 w-full flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // Show empty state if no data
    if (!data || data.length === 0) {
        return (
            <div className="h-64 w-full flex flex-col items-center justify-center text-white/40">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-bold text-white/60">No data available</p>
                <p className="text-sm mt-1">Create some course nodes to see progress</p>
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                        dy={10}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
                        label={{ value: 'Students', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'rgba(255,255,255,0.4)' } }}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: 'white' }}
                        itemStyle={{ color: 'white', fontWeight: 'bold' }}
                        formatter={(value) => [`${value} students`, 'Enrolled']}
                    />
                    <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8b5cf6' : '#6366f1'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ClassProgressChart;
