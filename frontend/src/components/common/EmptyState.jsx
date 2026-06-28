import React from 'react';
import Button from './Button';

const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="glass-card rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 p-10 flex flex-col items-center justify-center text-center gap-4">
        {Icon && (
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center">
                <Icon size={32} className="text-indigo-400 dark:text-indigo-300" />
            </div>
        )}
        <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 dark:text-white/40 max-w-xs mx-auto">{description}</p>
            )}
        </div>
        {action && (
            <Button onClick={action.onClick} className="mt-2">
                {action.label}
            </Button>
        )}
    </div>
);

export default EmptyState;
