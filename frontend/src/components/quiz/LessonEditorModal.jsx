import React, { useEffect, useState } from 'react';
import { Save, Loader2, Edit3, Eye, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import BaseModal from '../common/BaseModal';
import useToastStore from '../../store/toastStore';

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
                    <FileText size={18} className="text-purple-500" />
                    <span className="truncate">{nodeTitle || 'Lesson Summary'}</span>
                </div>
            }
            subtitle={
                <div className="flex items-center gap-2 mt-1">
                    {isGrounded ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20">
                            📄 Grounded in Materials
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-extrabold border border-purple-500/20">
                            🤖 AI Generated Content
                        </span>
                    )}
                </div>
            }
            maxWidth="max-w-3xl"
        >
            <div className="space-y-4">
                {/* Actions Toolbar */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-white/5 p-2.5 rounded-2xl border border-slate-200 dark:border-white/8">
                    <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-white/10 p-1 rounded-xl">
                        <button
                            onClick={() => setIsEditing(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !isEditing
                                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-sm'
                                    : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white'
                            }`}
                        >
                            <Eye size={14} /> Preview
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={13} className="animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={13} /> Save Summary
                                </>
                            )}
                        </button>
                    )}
                </div>

                {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold">
                        {errorMsg}
                    </div>
                )}

                {/* Content View / Edit Area */}
                {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="animate-spin text-purple-500" />
                        <span className="text-xs font-bold text-slate-400">
                            Loading lesson summary...
                        </span>
                    </div>
                ) : isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={16}
                            placeholder="Write or edit the lesson summary markdown content..."
                            className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-purple-500 transition-all resize-y"
                        />
                        <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium">
                            Supports standard Markdown formatting (headers `#`, lists `-`, bold
                            `**`).
                        </p>
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto p-5 rounded-2xl bg-slate-50 dark:bg-white/3 border border-slate-200/60 dark:border-white/5 space-y-3 prose dark:prose-invert max-w-none text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans select-text">
                        {content ? (
                            content.split('\n').map((line, idx) => {
                                if (line.startsWith('# ')) {
                                    return (
                                        <h1
                                            key={idx}
                                            className="text-base font-black text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-white/10"
                                        >
                                            {line.replace('# ', '')}
                                        </h1>
                                    );
                                }
                                if (line.startsWith('## ')) {
                                    return (
                                        <h2
                                            key={idx}
                                            className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-3 mb-1.5"
                                        >
                                            {line.replace('## ', '')}
                                        </h2>
                                    );
                                }
                                if (line.startsWith('### ')) {
                                    return (
                                        <h3
                                            key={idx}
                                            className="text-xs font-bold text-slate-800 dark:text-white mt-2.5 mb-1"
                                        >
                                            {line.replace('### ', '')}
                                        </h3>
                                    );
                                }
                                if (line.startsWith('* ') || line.startsWith('- ')) {
                                    return (
                                        <div key={idx} className="flex items-start gap-2 ml-2 my-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                            <span>{line.replace(/^[*|-]\s*/, '')}</span>
                                        </div>
                                    );
                                }
                                if (!line.trim()) {
                                    return <div key={idx} className="h-2" />;
                                }
                                return (
                                    <p key={idx} className="my-1">
                                        {line}
                                    </p>
                                );
                            })
                        ) : (
                            <div className="py-8 text-center text-slate-400">
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
