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
            <div className="h-64 w-full flex flex-col items-center justify-center text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-medium">No data available</p>
                <p className="text-sm mt-1">Create some course nodes to see progress</p>
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        dy={10}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        label={{ value: 'Students', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
                    />
                    <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        formatter={(value) => [`${value} students`, 'Enrolled']}
                    />
                    <Bar dataKey="students" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563EB' : '#60A5FA'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ClassProgressChart;
