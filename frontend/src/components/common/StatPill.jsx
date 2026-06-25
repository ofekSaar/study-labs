import React from 'react';

/**
 * Compact "stat pill": an icon (or emoji) + a value in a tinted, bordered capsule.
 * Consolidates the many bespoke streak / XP / coins / level badges scattered
 * across the layout, roadmap and leaderboard.
 *
 * Props:
 *  - icon       a lucide icon component (rendered with the variant color)
 *  - emoji      alternatively, an emoji string
 *  - value      the number/text shown
 *  - label      optional tiny uppercase caption after the value
 *  - variant    streak | xp | coins | level | neutral (default neutral)
 *  - size       sm | md (default sm)
 *  - title      native tooltip
 */
const VARIANTS = {
    streak: {
        wrap: 'bg-orange-500/10 border-orange-500/25',
        text: 'text-orange-600 dark:text-orange-400',
        icon: 'text-orange-500 fill-orange-500',
    },
    xp: {
        wrap: 'bg-amber-500/10 border-amber-500/25',
        text: 'text-amber-600 dark:text-amber-400',
        icon: 'text-amber-500',
    },
    coins: {
        wrap: 'bg-amber-500/10 border-amber-500/25',
        text: 'text-amber-600 dark:text-amber-400',
        icon: 'text-amber-500',
    },
    level: {
        wrap: 'bg-emerald-500/10 border-emerald-500/25',
        text: 'text-emerald-600 dark:text-emerald-400',
        icon: 'text-emerald-500',
    },
    neutral: {
        wrap: 'bg-slate-500/10 border-slate-400/25 dark:bg-white/5 dark:border-white/15',
        text: 'text-slate-600 dark:text-white/80',
        icon: 'text-slate-500 dark:text-white/60',
    },
};

const SIZES = {
    sm: { pad: 'px-2 py-1 gap-1', text: 'text-[10px]', icon: 12 },
    md: { pad: 'px-2.5 py-1 gap-1.5', text: 'text-[11px]', icon: 14 },
};

const StatPill = ({
    icon: Icon,
    emoji,
    value,
    label,
    variant = 'neutral',
    size = 'sm',
    title,
    className = '',
}) => {
    const v = VARIANTS[variant] || VARIANTS.neutral;
    const s = SIZES[size] || SIZES.sm;

    return (
        <div
            title={title}
            className={`inline-flex items-center ${s.pad} rounded-xl border ${v.wrap} ${className}`}
        >
            {Icon && <Icon size={s.icon} className={v.icon} />}
            {emoji && <span className="leading-none select-none" style={{ fontSize: s.icon }}>{emoji}</span>}
            <span className={`${s.text} font-black leading-none ${v.text}`}>{value}</span>
            {label && (
                <span className={`${s.text} font-black uppercase tracking-widest leading-none opacity-60 ${v.text}`}>{label}</span>
            )}
        </div>
    );
};

export default StatPill;
