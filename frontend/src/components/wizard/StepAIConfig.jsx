import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Network, Zap } from 'lucide-react';

const StepAIConfig = () => {
    const { register, watch } = useFormContext();
    const nodeCount = watch('nodeCount') || 10;
    const quizFrequency = watch('quizFrequency') || 3;

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-2">AI Path Configuration</h3>
            <p className="text-gray-500 mb-6">Fine-tune how our AI generates the learning map.</p>

            {/* Node Count Slider */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Network size={24} />
                        </div>
                        <div>
                            <label className="font-bold text-gray-900 block">Path Length</label>
                            <p className="text-xs text-gray-500">Number of learning nodes</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-studylabs-blue">{nodeCount}</span>
                </div>
                <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    {...register('nodeCount')}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-studylabs-blue"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Short (5)</span>
                    <span>Long (25)</span>
                </div>
            </div>

            {/* Quiz Frequency Slider */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                            <Zap size={24} />
                        </div>
                        <div>
                            <label className="font-bold text-gray-900 block">Quiz Frequency</label>
                            <p className="text-xs text-gray-500">Quiz every N nodes</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-studylabs-blue">{quizFrequency}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    {...register('quizFrequency')}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-studylabs-blue"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Frequent (1)</span>
                    <span>Sparse (5)</span>
                </div>
            </div>
        </div>
    );
};

export default StepAIConfig;
