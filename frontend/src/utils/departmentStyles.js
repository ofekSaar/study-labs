const DEPT_STYLES = {
    'computer science': { bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30', glow: 'rgba(168,85,247,0.15)', iconBg: 'bg-purple-500/20 dark:bg-purple-500/30 text-purple-600 dark:text-purple-400 border-purple-500/30' },
    cs:                 { bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30', glow: 'rgba(168,85,247,0.15)', iconBg: 'bg-purple-500/20 dark:bg-purple-500/30 text-purple-600 dark:text-purple-400 border-purple-500/30' },
    software:           { bg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30', glow: 'rgba(168,85,247,0.15)', iconBg: 'bg-purple-500/20 dark:bg-purple-500/30 text-purple-600 dark:text-purple-400 border-purple-500/30' },
    mathematics:        { bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30',         glow: 'rgba(59,130,246,0.15)',  iconBg: 'bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 dark:text-blue-400 border-blue-500/30'         },
    math:               { bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30',         glow: 'rgba(59,130,246,0.15)',  iconBg: 'bg-blue-500/20 dark:bg-blue-500/30 text-blue-600 dark:text-blue-400 border-blue-500/30'         },
    science:            { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30', glow: 'rgba(16,185,129,0.15)', iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    biology:            { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30', glow: 'rgba(16,185,129,0.15)', iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    chemistry:          { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30', glow: 'rgba(16,185,129,0.15)', iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    physics:            { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30', glow: 'rgba(16,185,129,0.15)', iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    business:           { bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',   glow: 'rgba(245,158,11,0.15)', iconBg: 'bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400 border-amber-500/30'         },
    economics:          { bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',   glow: 'rgba(245,158,11,0.15)', iconBg: 'bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400 border-amber-500/30'         },
    marketing:          { bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30',   glow: 'rgba(245,158,11,0.15)', iconBg: 'bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-400 border-amber-500/30'         },
};

const DEPT_DEFAULT = {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30',
    glow: 'rgba(99,102,241,0.15)',
    iconBg: 'bg-indigo-500/20 dark:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
};

/**
 * Returns Tailwind class strings and glow colour for a given department name.
 * @param {string|undefined} dept
 * @returns {{ bg: string, glow: string, iconBg: string }}
 */
export const getDeptStyle = (dept) =>
    DEPT_STYLES[dept?.toLowerCase() ?? ''] ?? DEPT_DEFAULT;
