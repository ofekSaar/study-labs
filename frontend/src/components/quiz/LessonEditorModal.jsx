import React, { useEffect, useState } from 'react';
import { Save, Loader2, Edit3, Eye, FileText } from 'lucide-react';
import api from '../../utils/api';
import BaseModal from '../common/BaseModal';
import useToastStore from '../../store/toastStore';
import ContentRenderer from '../common/ContentRenderer';

const LessonEditorModal = ({ courseId, nodeId, nodeTitle, isGrounded, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchContent = async () => {
            setLoading(true);
            setErrorMsg('');
            try {
                const { data } = await api.get(`/api/courses/${courseId}/nodes/${nodeId}/content`);
                if (isMounted) {
                    setContent(data.content || '');
                }
            } catch (err) {
                if (isMounted) {
                    setErrorMsg(err.message || 'Failed to load lesson summary.');
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (courseId && nodeId) {
            fetchContent();
        }
        return () => {
            isMounted = false;
        };
    }, [courseId, nodeId]);

    const handleSave = async () => {
        setSaving(true);
        setErrorMsg('');
        try {
            await api.put(`/api/courses/${courseId}/nodes/${nodeId}/content`, { content });
            useToastStore.getState().addToast({
                type: 'success',
                title: 'Summary Saved',
                message: `Updated summary for "${nodeTitle}".`,
            });
            setIsEditing(false);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to save lesson summary.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <BaseModal
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 pr-6">
                    <FileText size={20} className="text-purple-500 shrink-0" />
                    <span className="truncate text-base sm:text-lg">
                        {nodeTitle || 'Lesson Summary'}
                    </span>
                </div>
            }
            subtitle={
                <div className="flex items-center gap-2 mt-1">
                    {isGrounded ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/20">
                            📄 Grounded in Materials
                        </span>
                    ) : (
                        <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-extrabold border border-purple-500/20">
                            🤖 AI Generated Content
                        </span>
                    )}
                </div>
            }
            maxWidth="max-w-5xl"
            bodyClassName="p-4 sm:p-6 overflow-hidden flex flex-col"
        >
            <div className="space-y-4 flex flex-col min-h-[500px]">
                {/* Actions Toolbar */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5 p-2.5 rounded-2xl border border-slate-200 dark:border-white/8 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-white/10 p-1 rounded-xl">
                        <button
                            onClick={() => setIsEditing(false)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !isEditing
                                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-sm'
                                    : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white'
                            }`}
                        >
                            <Eye size={14} /> Preview
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isEditing
                                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-sm'
                                    : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white'
                            }`}
                        >
                            <Edit3 size={14} /> Edit Markdown
                        </button>
                    </div>

                    {isEditing && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={14} /> Save Summary
                                </>
                            )}
                        </button>
                    )}
                </div>

                {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold shrink-0">
                        {errorMsg}
                    </div>
                )}

                {/* Content View / Edit Area */}
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <Loader2 size={28} className="animate-spin text-purple-500" />
                        <span className="text-xs font-bold text-slate-400">
                            Loading lesson summary...
                        </span>
                    </div>
                ) : isEditing ? (
                    <div className="flex-1 flex flex-col space-y-2">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write or edit the lesson summary markdown content..."
                            className="w-full h-[62vh] min-h-[420px] p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 transition-all resize-y leading-relaxed"
                        />
                        <p className="text-[11px] text-slate-400 dark:text-white/40 font-medium">
                            Supports standard Markdown (`#`, `-`, `**bold**`) & LaTeX math equations
                            (`{'$\\Sigma = \\{a, b, c\\}$'}`).
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 max-h-[68vh] min-h-[420px] overflow-y-auto p-6 rounded-2xl bg-slate-50 dark:bg-white/3 border border-slate-200/60 dark:border-white/5 custom-scrollbar">
                        {content ? (
                            <ContentRenderer content={content} />
                        ) : (
                            <div className="py-16 text-center text-slate-400">
                                <p className="font-bold">No summary content found for this node.</p>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="mt-2 text-xs font-bold text-purple-500 underline"
                                >
                                    Click here to write content
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

export default LessonEditorModal;
