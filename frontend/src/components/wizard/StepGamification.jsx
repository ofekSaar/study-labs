import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Trophy, Star, Zap, Medal, Flame, Crown, Sparkles } from 'lucide-react';

const MOCK_LEADERBOARD = [
    { rank: 1, name: 'Alex K.', xp: 3840, avatar: '🦊' },
    { rank: 2, name: 'Sarah M.', xp: 3210, avatar: '🐯' },
    { rank: 3, name: 'James R.', xp: 2990, avatar: '🦅' },
];

const getEngagementScore = (xpMultiplier, leaderboardEnabled) => {
    const score = (parseFloat(xpMultiplier) - 1) * 4 + (leaderboardEnabled ? 3 : 0);
    if (score >= 6) return { label: 'Legendary', icon: Crown, color: 'text-amber-600', bg: 'bg-gradient-to-r from-amber-50 to-orange-50', border: 'border-amber-200', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]' };
    if (score >= 4) return { label: 'High', icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', glow: '' };
    if (score >= 2) return { label: 'Medium', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', glow: '' };
    return { label: 'Low', icon: Star, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', glow: '' };
};

const StepGamification = () => {
    const { register, watch, setValue } = useFormContext();
    const leaderboardEnabled = watch('leaderboardEnabled');
    const xpMultiplier = parseFloat(watch('xpMultiplier')) || 1.0;

    const engagement = getEngagementScore(xpMultiplier, leaderboardEnabled);
    const EngagementIcon = engagement.icon;

    const baseXP = 100;
    const boostedXP = Math.round(baseXP * xpMultiplier);

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900">Gamification</h3>
                    <p className="text-gray-500 mt-1">Boost student motivation with XP and competition.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                    <Sparkles size={12} />
                    +50 XP
                </div>
            </div>

            {/* Engagement Score */}
            <div className={`rounded-2xl border-2 p-4 transition-all duration-300 ${engagement.bg} ${engagement.border} ${engagement.glow}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Course Engagement Score</p>
                        <div className="flex items-center gap-2">
                            <EngagementIcon size={20} className={engagement.color} />
                            <span className={`text-xl font-display font-black ${engagement.color}`}>{engagement.label}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 mb-1">Est. completion rate</p>
                        <p className={`text-2xl font-display font-black ${engagement.color}`}>
                            {engagement.label === 'Legendary' ? '94%' :
                             engagement.label === 'High' ? '82%' :
                             engagement.label === 'Medium' ? '68%' : '51%'}
                        </p>
                    </div>
                </div>
            </div>

            {/* XP Multiplier */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-orange-100 text-studylabs-orange rounded-xl">
                        <Star size={20} />
                    </div>
                    <div>
                        <label className="font-bold text-gray-900 text-sm block">XP Multiplier</label>
                        <p className="text-xs text-gray-400">Boost rewards for completing this course</p>
                    </div>
                </div>

                {/* Big XP Display */}
                <div className="flex items-center justify-center mb-5">
                    <div className={`relative flex flex-col items-center justify-center w-32 h-32 rounded-full transition-all duration-300
                        ${xpMultiplier >= 1.5
                            ? 'bg-gradient-to-br from-amber-400 to-studylabs-orange shadow-[0_0_30px_rgba(217,119,87,0.4)]'
                            : 'bg-gradient-to-br from-gray-200 to-gray-300'
                        }`}
                    >
                        <span className={`text-3xl font-display font-black ${xpMultiplier >= 1.5 ? 'text-white' : 'text-gray-600'}`}>
                            {xpMultiplier.toFixed(1)}x
                        </span>
                        {xpMultiplier > 1.0 && (
                            <span className={`text-[10px] font-bold mt-0.5 ${xpMultiplier >= 1.5 ? 'text-orange-100' : 'text-gray-500'}`}>
                                BONUS XP
                            </span>
                        )}
                        {xpMultiplier >= 1.5 && (
                            <div className="absolute -inset-1 rounded-full border-2 border-amber-300/50 animate-pulse" />
                        )}
                    </div>
                </div>

                {/* XP Comparison */}
                <div className="flex items-center justify-center gap-4 mb-4 text-sm">
                    <div className="text-center">
                        <p className="text-gray-400 text-xs">Standard</p>
                        <p className="font-bold text-gray-500">{baseXP} XP</p>
                    </div>
                    <div className="flex items-center gap-1 text-studylabs-orange">
                        <span className="text-lg">→</span>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-bold text-studylabs-orange">This Course</p>
                        <p className={`font-black text-lg ${xpMultiplier > 1 ? 'text-studylabs-orange' : 'text-gray-500'}`}>{boostedXP} XP</p>
                    </div>
                </div>

                <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.1"
                    {...register('xpMultiplier')}
                    className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-studylabs-orange"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1.5">
                    <span>1.0x (Standard)</span>
                    <span>2.0x (Max Boost)</span>
                </div>
            </div>

            {/* Leaderboard Toggle */}
            <div className={`rounded-2xl border-2 p-4 transition-all duration-300 ${leaderboardEnabled ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl transition-colors ${leaderboardEnabled ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Trophy size={20} />
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 text-sm block">Public Leaderboard</span>
                            <span className="text-xs text-gray-400">Students compete for top spots</span>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                            type="checkbox"
                            {...register('leaderboardEnabled')}
                            className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
                    </label>
                </div>

                {/* Mini Leaderboard Preview */}
                <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${!leaderboardEnabled ? 'opacity-40' : ''}`}>
                    {!leaderboardEnabled && (
                        <div className="absolute inset-0 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-500 bg-white/80 px-3 py-1 rounded-full">Enable to show leaderboard</span>
                        </div>
                    )}
                    <div className="space-y-2">
                        {MOCK_LEADERBOARD.map((entry) => (
                            <div key={entry.rank} className={`flex items-center gap-3 p-2.5 rounded-xl ${entry.rank === 1 ? 'bg-amber-50 border border-amber-100' : 'bg-white border border-gray-50'}`}>
                                <span className="text-base">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                                <span className="text-lg">{entry.avatar}</span>
                                <span className="flex-1 font-medium text-gray-700 text-sm">{entry.name}</span>
                                <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                                    <Zap size={11} />
                                    {entry.xp.toLocaleString()} XP
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Badge Preview */}
            <div className="glass-card rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Completion Badge Preview</p>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-studylabs-orange to-studylabs-purple flex items-center justify-center shadow-lg">
                            <Medal size={28} className="text-white" />
                        </div>
                        {xpMultiplier >= 1.5 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[9px]">⭐</div>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">Course Completer</p>
                        <p className="text-xs text-gray-400 mt-0.5">Awarded to students who finish all lessons</p>
                        {xpMultiplier >= 1.5 && (
                            <p className="text-xs text-amber-600 font-bold mt-1">✨ Boosted — earns {boostedXP} XP</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepGamification;
