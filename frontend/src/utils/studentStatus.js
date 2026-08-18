import { MS_PER_DAY } from '../constants/config';

/**
 * Presentation helpers for student progress/status badges, shared by the
 * instructor analytics pages (StudentStatusOverview, ClassRoster).
 */

export const RANK_MEDAL = ['🥇', '🥈', '🥉'];

export function difficultyFromPct(pct) {
    if (pct == null || pct === 0)
        return {
            label: 'Not Tested',
            color: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10',
        };
    if (pct >= 70)
        return {
            label: 'Easy',
            color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
        };
    if (pct >= 30)
        return {
            label: 'Medium',
            color: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
        };
    return {
        label: 'Challenging',
        color: 'bg-rose-500/10 text-rose-500 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
    };
}

export function relativeTime(dateStr) {
    if (!dateStr) return 'Never';
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / MS_PER_DAY);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1 week ago';
    if (weeks < 5) return `${weeks} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}

export function studentBadge(s) {
    if (s.completion === 0)
        return {
            label: 'Not Started',
            color: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10',
        };
    const daysSince = s.lastActivityDate
        ? Math.floor((Date.now() - new Date(s.lastActivityDate).getTime()) / MS_PER_DAY)
        : 999;
    
    // Only mark "At Risk" if they haven't been active for over a week, 
    // or if they are stuck (active recently but extremely low completion after weeks)
    if (daysSince > 7)
        return {
            label: 'At Risk',
            color: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
        };
    return {
        label: 'On Track',
        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
    };
}

export function completionBarGradient(pct) {
    if (pct >= 70) return 'from-emerald-500 to-teal-400';
    if (pct >= 30) return 'from-amber-500 to-orange-400';
    return 'from-red-500 to-rose-400';
}

export function issueConfig(issue) {
    if (!issue || issue === 'Never started')
        return {
            label: 'Never started',
            cls: 'bg-red-500/10 text-red-500 border-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
        };
    if (issue.startsWith('Inactive'))
        return {
            label: issue,
            cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30',
        };
    return {
        label: 'Low progress',
        cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
    };
}
