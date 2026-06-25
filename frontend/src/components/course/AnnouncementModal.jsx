import React, { useState } from 'react';
import { Pin, Trash2, Loader2 } from 'lucide-react';
import useCourseStore from '../../store/courseStore';
import BaseModal from '../common/BaseModal';

const AnnouncementModal = ({ courseId, onClose }) => {
    const { announcements, createAnnouncement, deleteAnnouncement } = useCourseStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await createAnnouncement(courseId, { title, content, isPinned });
            setTitle('');
            setContent('');
            setIsPinned(false);
        } catch {
            setError('Failed to post announcement.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            await deleteAnnouncement(courseId, id);
        } catch {
            // silent — store already keeps previous state on error
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <BaseModal
            isOpen
            onClose={onClose}
            title="Course Announcements"
            subtitle="Post a message visible to all enrolled students."
            size="lg"
        >
                {/* Compose */}
                <div className="space-y-3 mb-5">
                    <input
                        type="text"
                        placeholder="Announcement title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <textarea
                        placeholder="Write your message here…"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        maxLength={2000}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                    />
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-slate-600 dark:text-white/60">
                        <button
                            type="button"
                            onClick={() => setIsPinned(!isPinned)}
                            className={`w-9 h-5 rounded-full transition-colors ${isPinned ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-white/10'} flex items-center px-0.5`}
                        >
                            <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isPinned ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <Pin size={13} className={isPinned ? 'text-indigo-500' : ''} />
                        Pin this announcement
                    </label>
                    {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {submitting ? <><Loader2 size={15} className="animate-spin" /> Posting…</> : 'Post Announcement'}
                    </button>
                </div>

                {/* Existing announcements */}
                {announcements.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-white/10 pt-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Posted</p>
                        {announcements.map((ann) => (
                            <div
                                key={ann._id}
                                className="flex items-start justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        {ann.isPinned && <Pin size={11} className="text-indigo-500 shrink-0" />}
                                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{ann.title}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-white/50 line-clamp-2">{ann.content}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {ann.instructor?.name && <span className="font-semibold">{ann.instructor.name} · </span>}
                                        {new Date(ann.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(ann._id)}
                                    disabled={deletingId === ann._id}
                                    className="shrink-0 p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition disabled:opacity-40"
                                >
                                    {deletingId === ann._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
        </BaseModal>
    );
};

export default AnnouncementModal;
