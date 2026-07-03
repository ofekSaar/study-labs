import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, TrendingDown, ChevronRight, Megaphone } from 'lucide-react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AtRiskStudentsWidget = ({ courses = [] }) => {
    const [atRiskStudents, setAtRiskStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const navigate = useNavigate();

    const readyCourses = courses.filter((c) => c.generationStatus === 'ready').slice(0, 5);

    useEffect(() => {
        if (readyCourses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(readyCourses[0]._id);
        }
    }, [readyCourses.length]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!selectedCourseId) return;
        const fetch = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get(`/api/courses/${selectedCourseId}/analytics`);
                setAtRiskStudents(data.atRiskStudents || []);
            } catch {
                setAtRiskStudents([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [selectedCourseId]);

    if (readyCourses.length === 0) return null;

    return (
        <div
            className="bg-white dark:bg-white/5 border border-red-200/60 dark:border-red-500/15 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-red-100 dark:border-red-500/10">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={12} className="text-red-500" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60">
                        At-Risk Students
                    </span>
                    {atRiskStudents.length > 0 && (
                        <span className="text-[9px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                            {atRiskStudents.length}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => navigate('/instructor/status')}
                    className="text-[10px] font-black text-red-500 dark:text-red-400 hover:text-red-700 flex items-center gap-0.5 transition-colors"
                >
                    View all <ChevronRight size={10} />
                </button>
            </div>

            {/* Course selector */}
            {readyCourses.length > 1 && (
                <div className="px-4 py-2 flex gap-1.5 flex-wrap border-b border-slate-100 dark:border-white/5">
                    {readyCourses.map((c) => (
                        <button
                            key={c._id}
                            onClick={() => setSelectedCourseId(c._id)}
                            className={`text-[9px] font-black px-2 py-0.5 rounded-lg border transition-all ${
                                selectedCourseId === c._id
                                    ? 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 hover:border-red-400/20'
                            }`}
                        >
                            {c.title.length > 20 ? c.title.slice(0, 20) + '…' : c.title}
                        </button>
                    ))}
                </div>
            )}

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-white/5">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-12 mx-3 my-1.5 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse"
                        />
                    ))
                ) : atRiskStudents.length === 0 ? (
                    <div className="py-8 flex flex-col items-center gap-2 text-slate-400 dark:text-white/30">
                        <AlertTriangle size={22} className="opacity-30" />
                        <p className="text-sm font-bold">All students on track!</p>
                        <p className="text-[11px]">No students flagged at this time.</p>
                    </div>
                ) : (
                    atRiskStudents.slice(0, 5).map((s, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50/50 dark:hover:bg-red-500/5 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0 text-sm font-black text-red-600 dark:text-red-400">
                                {s.student?.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                    {s.student?.name || 'Unknown'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {s.daysSinceActive > 5 ? (
                                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                                            <Clock size={9} /> {s.daysSinceActive}d inactive
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-400">
                                            <TrendingDown size={9} /> {s.completion}% done
                                        </span>
                                    )}
                                    <span className="text-[9px] text-slate-400 dark:text-white/25">
                                        {s.issue}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() =>
                                    navigate(`/instructor/managed?announce=${selectedCourseId}`)
                                }
                                title="Send announcement"
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/15 text-red-400 hover:text-red-600 transition-colors"
                            >
                                <Megaphone size={13} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AtRiskStudentsWidget;
