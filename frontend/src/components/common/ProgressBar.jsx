import React from 'react';
import { motion } from 'framer-motion';

// Variants mirror the exact gradients already used across the app so the
// shared component is a drop-in replacement with no visual drift.
const VARIANTS = {
    progress: 'bg-gradient-to-r from-orange-500 to-amber-400',
    done: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    fail: 'bg-gradient-to-r from-red-400 to-red-500',
    level: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
    xp: 'xp-bar-fill',
    primary: 'bg-grad-primary',
};

const HEIGHTS = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
};

/**
 * Shared progress bar. Replaces the many one-off
 * `<div class="... rounded-full overflow-hidden"><div .../></div>` markups.
 *
 * Props:
 *  - value      0-100 (clamped)
 *  - variant    progress | done | fail | level | xp | primary
 *  - height     sm | md | lg (default md)
 *  - animated   animate the fill width on mount/change (default true)
 *  - trackClassName / fillClassName  escape hatches
 */
const ProgressBar = ({
    value = 0,
    variant = 'progress',
    height = 'md',
    animated = true,
    className = '',
    trackClassName = '',
    fillClassName = '',
}) => {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    const fill = VARIANTS[variant] || VARIANTS.primary;

    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={`w-full ${HEIGHTS[height] || HEIGHTS.md} bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden ${trackClassName} ${className}`}
        >
            {animated ? (
                <motion.div
                    className={`h-full rounded-full ${fill} ${fillClassName}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
            ) : (
                <div
                    className={`h-full rounded-full ${fill} ${fillClassName}`}
                    style={{ width: `${pct}%` }}
                />
            )}
        </div>
    );
};

export default ProgressBar;
