import React from 'react';

/**
 * Compact empty-state for panels/tables inside analytics pages.
 * For full-page empty states use components/common/EmptyState instead.
 */
const PanelEmptyState = ({ icon, title, subtitle, compact = false }) => (
    <div
        className={`text-center text-slate-400 dark:text-white/40 font-medium flex flex-col items-center ${compact ? 'py-8' : 'py-12'}`}
    >
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-400 dark:text-white/30">
            {icon}
        </div>
        <p className="font-bold text-slate-600 dark:text-white/50 text-sm">{title}</p>
        {subtitle && <p className="text-xs mt-1 text-slate-400 dark:text-white/30">{subtitle}</p>}
    </div>
);

export default PanelEmptyState;
