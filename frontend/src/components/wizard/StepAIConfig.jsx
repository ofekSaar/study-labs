import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Network, Zap, Sparkles } from 'lucide-react';

const PRESETS = [
    { label: 'Short', nodes: 5, desc: '~1-2 weeks' },
    { label: 'Medium', nodes: 12, desc: '~3-4 weeks' },
    { label: 'Long', nodes: 20, desc: '~6-8 weeks' },
];

const PathPreview = ({ nodeCount, quizFrequency }) => {
    const nodes = Array.from({ length: nodeCount }, (_, i) => i);
    const visibleNodes = nodes.slice(0, Math.min(nodeCount, 18));
    const hasMore = nodeCount > 18;

    return (
        <div className="glass-card rounded-2xl p-4 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Learning Path Preview</p>
            <div className="flex items-center flex-wrap gap-1.5">
                {visibleNodes.map((i) => {
                    const isQuiz = (i + 1) % quizFrequency === 0;
                    return (
                        <React.Fragment key={i}>
                            <div
                                className={`relative flex items-center justify-center rounded-full transition-all duration-300 text-[9px] font-black
                                    ${isQuiz
                                        ? 'w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                        : 'w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_6px_rgba(124,58,237,0.3)]'
                                    }`}
                                title={isQuiz ? `Quiz at node ${i + 1}` : `Node ${i + 1}`}
                            >
                                {isQuiz ? '⚡' : ''}
                            </div>
                            {i < visibleNodes.length - 1 && (
                                <div className="w-2 h-0.5 bg-gray-200 rounded-full" />
                            )}
                        </React.Fragment>
                    );
                })}
                {hasMore && (
                    <>
                        <div className="w-2 h-0.5 bg-gray-200 rounded-full" />
                        <div className="flex items-center gap-0.5">
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                            <div className="w-1.5 h-1.5 bg-gray-100 rounded-full" />
                        </div>
                    </>
                )}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 inline-block" />
                    Lesson node
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 inline-flex items-center justify-center text-[8px]">⚡</span>
                    Quiz
                </span>
            </div>
        </div>
    );
};

const StepAIConfig = () => {
    const { register, watch, setValue } = useFormContext();
    const nodeCount = parseInt(watch('nodeCount')) || 10;
    const quizFrequency = parseInt(watch('quizFrequency')) || 3;

    const quizCount = Math.floor(nodeCount / quizFrequency);
    const weeksEstimate = Math.ceil(nodeCount / 4);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900">AI Path Configuration</h3>
                    <p className="text-gray-500 mt-1">Fine-tune how the AI generates your learning map.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                    <Sparkles size={12} />
                    +50 XP
                </div>
            </div>

            {/* Path Preview */}
            <PathPreview nodeCount={nodeCount} quizFrequency={quizFrequency} />

            {/* Node Count */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 text-studylabs-purple rounded-xl">
                            <Network size={20} />
                        </div>
                        <div>
                            <label className="font-bold text-gray-900 text-sm block">Path Length</label>
                            <p className="text-xs text-gray-400">Number of learning nodes · ~{weeksEstimate} week{weeksEstimate !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <span className="text-3xl font-display font-black text-studylabs-purple">{nodeCount}</span>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => setValue('nodeCount', preset.nodes)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 border-2 flex flex-col items-center gap-0.5
                                ${nodeCount === preset.nodes
                                    ? 'border-studylabs-purple bg-purple-50 text-studylabs-purple'
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-purple-200 hover:bg-purple-50/50'
                                }`}
                        >
                            <span>{preset.label}</span>
                            <span className={`text-[10px] font-normal ${nodeCount === preset.nodes ? 'text-purple-400' : 'text-gray-300'}`}>{preset.desc}</span>
                        </button>
                    ))}
                </div>

                <input
                    type="range"
                    min="5"
                    max="25"
                    step="1"
                    {...register('nodeCount')}
                    className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-studylabs-purple"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1.5">
                    <span>5</span>
                    <span>25</span>
                </div>
            </div>

            {/* Quiz Frequency */}
            <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
                            <Zap size={20} />
                        </div>
                        <div>
                            <label className="font-bold text-gray-900 text-sm block">Quiz Frequency</label>
                            <p className="text-xs text-gray-400">Quiz every {quizFrequency} node{quizFrequency !== 1 ? 's' : ''} · ~{quizCount} quiz{quizCount !== 1 ? 'zes' : ''} total</p>
                        </div>
                    </div>
                    <span className="text-3xl font-display font-black text-amber-600">{quizFrequency}</span>
                </div>

                <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    {...register('quizFrequency')}
                    className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1.5">
                    <span>Frequent (1)</span>
                    <span>Sparse (5)</span>
                </div>

                {/* Recommendation pill */}
                <div className="mt-3 flex justify-center">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                        quizFrequency === 3
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : quizFrequency <= 2
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                        {quizFrequency <= 1 ? '⚡ Intensive — frequent testing' :
                         quizFrequency === 2 ? '🔥 Challenging — good for fast learners' :
                         quizFrequency === 3 ? '✅ Balanced — recommended' :
                         quizFrequency === 4 ? '😊 Relaxed — good for beginners' :
                         '🎯 Light — minimal assessment'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StepAIConfig;
