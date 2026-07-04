import React from 'react';

/** Pulsing table placeholder shown while tabular data loads. */
export const TableSkeleton = ({ cols = 4, rows = 5 }) => (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
        <table className="w-full border-collapse">
            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                {Array.from({ length: rows }).map((_, i) => (
                    <tr key={i}>
                        {Array.from({ length: cols }).map((_, j) => (
                            <td key={j} className="px-5 py-4">
                                <div
                                    className="h-4 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse"
                                    style={{ width: `${55 + ((j * 17 + i * 11) % 35)}%` }}
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

/** Pulsing list-of-cards placeholder (avatar + two text lines). */
export const CardSkeleton = ({ rows = 3 }) => (
    <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
            <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200/60 dark:border-white/5"
            >
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-3/4" />
                    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse w-1/2" />
                </div>
            </div>
        ))}
    </div>
);
