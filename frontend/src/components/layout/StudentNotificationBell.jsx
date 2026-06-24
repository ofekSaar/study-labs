import React, { useState, useRef, useEffect } from 'react';
import { Bell, Megaphone, CheckCheck, Trash2, BookOpen } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import { useNavigate } from 'react-router-dom';

const typeIcon = (type) => {
    if (type === 'announcement') return <Megaphone size={14} className="text-indigo-500 shrink-0 mt-0.5" />;
    return <BookOpen size={14} className="text-emerald-500 shrink-0 mt-0.5" />;
};

const StudentNotificationBell = ({ dropUp = false }) => {
    const { notifications, markAllRead, clearAll } = useNotificationStore();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    const unread = notifications.filter((n) => !n.read).length;

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        setOpen((v) => !v);
        if (!open && unread > 0) markAllRead();
    };

    const handleNotificationClick = (n) => {
        if (n.courseId) navigate(`/course/${n.courseId}`);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[9px] font-black flex items-center justify-center leading-none">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className={`absolute ${dropUp ? 'left-0 bottom-full mb-2' : 'right-0 top-10'} w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/10">
                        <span className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">Notifications</span>
                        <div className="flex items-center gap-1">
                            {notifications.length > 0 && (
                                <>
                                    <button
                                        onClick={markAllRead}
                                        title="Mark all read"
                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                                    >
                                        <CheckCheck size={14} />
                                    </button>
                                    <button
                                        onClick={clearAll}
                                        title="Clear all"
                                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Bell size={24} className="mx-auto mb-2 text-slate-300 dark:text-white/20" />
                                <p className="text-xs text-slate-400 dark:text-white/30 font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 ${
                                        !n.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                                    }`}
                                >
                                    {typeIcon(n.type)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-slate-500 dark:text-white/40 uppercase tracking-wider mb-0.5">
                                            {n.type === 'announcement' ? n.courseTitle : 'Enrollment'}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 line-clamp-2">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {new Date(n.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentNotificationBell;
