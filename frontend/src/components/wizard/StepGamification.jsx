import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Trophy, Star } from 'lucide-react';

const StepGamification = () => {
    const { register, watch } = useFormContext();
    const leaderboardEnabled = watch('leaderboardEnabled');

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Gamification Settings</h3>
            <p className="text-gray-500 mb-6">Customize the engagement mechanics for your students.</p>

            {/* Leaderboard Toggle */}
            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${leaderboardEnabled ? 'border-studylabs-blue bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-colors ${leaderboardEnabled ? 'bg-studylabs-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <Trophy size={24} />
                    </div>
                    <div>
                        <span className="font-bold text-gray-900 block">Public Leaderboard</span>
                        <span className="text-sm text-gray-500">Allow students to compare XP publicly</span>
                    </div>
                </div>
                <input
                    type="checkbox"
                    {...register('leaderboardEnabled')}
                    className="w-6 h-6 text-studylabs-blue rounded focus:ring-studylabs-blue"
                />
            </label>

            {/* XP Multiplier */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Star size={24} />
                    </div>
                    <div>
                        <label className="font-bold text-gray-900 block">XP Multiplier</label>
                        <p className="text-xs text-gray-500">Boost rewards for this course</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-500">1.0x</span>
                    <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.1"
                        {...register('xpMultiplier')}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="text-sm font-bold text-gray-500">2.0x</span>
                </div>
                <p className="text-center font-bold text-orange-600 mt-2 text-lg">
                    {watch('xpMultiplier') || 1.0}x
                </p>
            </div>
        </div>
    );
};

export default StepGamification;
