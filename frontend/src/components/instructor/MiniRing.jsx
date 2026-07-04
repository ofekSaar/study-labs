import React from 'react';

/** Small SVG progress ring used in analytics cards. */
const MiniRing = ({ pct, size = 52, stroke = 6, color = '#8B5CF6' }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const filled = Math.min(pct / 100, 1) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-slate-200 dark:text-white/10"
            />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeDasharray={`${filled} ${circ}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
            />
        </svg>
    );
};

export default MiniRing;
