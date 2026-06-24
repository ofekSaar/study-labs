import React, { useState } from 'react';
import { Megaphone, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import useCourseStore from '../../store/courseStore';

const INITIAL_SHOW = 3;

const AnnouncementsPanel = () => {
    const { announcements } = useCourseStore();
    const [expanded, setExpanded] = useState(false);

    if (!announcements || announcements.length === 0) return null;

    const visible = expanded ? announcements : announcements.slice(0, INITIAL_SHOW);
    const hasMore = announcements.length > INITIAL_SHOW;

    return (
        <div className="mb-6 px-4 md:px-0">
            <div className="flex items-center gap-2 mb-3">
                <Megaphone size={15} className="text-indigo-500" />
                <span className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">
                    Announcements
                </span>
            </div>
            <div className="space-y-2">
                {visible.map((ann) => (
                    <div
                        key={ann._id}
                        className={`rounded-2xl border px-4 py-3 ${
                            ann.isPinned
                                ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/30'
                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
                        }`}
                    >
                        <div className="flex items-start gap-2">
                            {ann.isPinned && (
                                <Pin size={12} className="text-indigo-500 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{ann.title}</p>
                                <p className="text-xs text-slate-600 dark:text-white/60 mt-0.5 whitespace-pre-line">{ann.content}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5">
                                    {ann.instructor?.name && <span className="font-semibold">{ann.instructor.name} · </span>}
                                    {new Date(ann.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {hasMore && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="mt-2 flex items-center gap-1 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition"
                >
                    {expanded ? (
                        <><ChevronUp size={14} /> Show less</>
                    ) : (
                        <><ChevronDown size={14} /> Show all ({announcements.length})</>
                    )}
                </button>
            )}
        </div>
    );
};

export default AnnouncementsPanel;
