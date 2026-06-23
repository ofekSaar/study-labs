import React, { useEffect, useState } from 'react';
import { X, Save, Trash2, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const QUESTION_STATUSES = { idle: 'idle', saving: 'saving', saved: 'saved', error: 'error' };

const QuestionCard = ({ question, index, nodeId, onDelete }) => {
    const [open, setOpen] = useState(index === 0);
    const [form, setForm] = useState({
        question: question.question || '',
        options: question.options ? [...question.options] : ['', '', '', ''],
        correctAnswerIndex: question.correctAnswerIndex ?? 0,
        explanation: question.explanation || '',
        alignmentWarning: question.alignmentWarning ?? false,
    });
    const [status, setStatus] = useState(QUESTION_STATUSES.idle);
    const [errorMsg, setErrorMsg] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(false);

    const setOption = (i, value) => {
        const next = [...form.options];
        next[i] = value;
        setForm(f => ({ ...f, options: next }));
    };

    const handleSave = async () => {
        if (!form.question.trim()) { setErrorMsg('השאלה לא יכולה להיות ריקה'); return; }
        setStatus(QUESTION_STATUSES.saving);
        setErrorMsg('');
        try {
            await api.put(`/api/quizzes/node/${nodeId}/question/${index}`, {
                question: form.question.trim(),
                options: form.options.map(o => o.trim()),
                correctAnswerIndex: form.correctAnswerIndex,
                explanation: form.explanation.trim(),
                alignmentWarning: false, // manual edit clears the warning
            });
            setForm(f => ({ ...f, alignmentWarning: false }));
            setStatus(QUESTION_STATUSES.saved);
            setTimeout(() => setStatus(QUESTION_STATUSES.idle), 2500);
        } catch (err) {
            setErrorMsg(err.message || 'שגיאה בשמירה');
            setStatus(QUESTION_STATUSES.error);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        try {
            await api.delete(`/api/quizzes/node/${nodeId}/question/${index}`);
            onDelete(index);
        } catch (err) {
            setErrorMsg(err.message || 'שגיאה במחיקה');
            setConfirmDelete(false);
        }
    };

    return (
        <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
            {/* Card header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors text-left"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {form.question || 'שאלה ריקה'}
                    </span>
                    {form.alignmentWarning && (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                            <AlertTriangle size={10} /> לא מחובר לסיכום
                        </span>
                    )}
                </div>
                {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
            </button>

            {open && (
                <div className="px-4 py-4 space-y-4 bg-white dark:bg-slate-900">
                    {/* Warning banner */}
                    {form.alignmentWarning && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            השאלה הזו לא נמצאה בחפיפה ישירה עם הסיכום. מומלץ לעדכן את הניסוח.
                        </div>
                    )}

                    {/* Question text */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-1.5">
                            טקסט השאלה
                        </label>
                        <textarea
                            value={form.question}
                            onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white text-sm focus:border-indigo-400 focus:outline-none transition-colors resize-none"
                            dir="auto"
                        />
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-1.5">
                            תשובות (סמן את הנכונה)
                        </label>
                        <div className="space-y-2">
                            {form.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name={`correct-${nodeId}-${index}`}
                                        checked={form.correctAnswerIndex === i}
                                        onChange={() => setForm(f => ({ ...f, correctAnswerIndex: i }))}
                                        className="accent-indigo-500 w-4 h-4 shrink-0 cursor-pointer"
                                    />
                                    <input
                                        value={opt}
                                        onChange={e => setOption(i, e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white text-sm focus:border-indigo-400 focus:outline-none transition-colors"
                                        placeholder={`אפשרות ${i + 1}`}
                                        dir="auto"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-1.5">
                            הסבר (אחרי תשובה)
                        </label>
                        <textarea
                            value={form.explanation}
                            onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white text-sm focus:border-indigo-400 focus:outline-none transition-colors resize-none"
                            dir="auto"
                            placeholder="הסבר אופציונלי..."
                        />
                    </div>

                    {errorMsg && (
                        <p className="text-xs text-red-500 font-semibold">{errorMsg}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                        <button
                            onClick={handleDelete}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                confirmDelete
                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                    : 'bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50'
                            }`}
                        >
                            <Trash2 size={13} />
                            {confirmDelete ? 'לחץ שוב לאישור' : 'מחק שאלה'}
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={status === QUESTION_STATUSES.saving}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {status === QUESTION_STATUSES.saving ? (
                                <Loader2 size={13} className="animate-spin" />
                            ) : status === QUESTION_STATUSES.saved ? (
                                <CheckCircle size={13} />
                            ) : (
                                <Save size={13} />
                            )}
                            {status === QUESTION_STATUSES.saving ? 'שומר...' : status === QUESTION_STATUSES.saved ? 'נשמר!' : 'שמור'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const QuizEditorModal = ({ nodeId, nodeTitle, onClose }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get(`/api/quizzes/node/${nodeId}`);
                setQuestions(data.questions || []);
            } catch (err) {
                setError(err.message || 'שגיאה בטעינת השאלות');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [nodeId]);

    const handleDelete = (deletedIndex) => {
        setQuestions(prev => {
            const next = prev.filter((_, i) => i !== deletedIndex);
            return next;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/10 shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">עריכת בוחן</h2>
                        <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 truncate max-w-xs">{nodeTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500 font-semibold text-sm">{error}</div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-sm">אין שאלות בבוחן הזה</div>
                    ) : (
                        questions.map((q, i) => (
                            <QuestionCard
                                key={`${nodeId}-${i}`}
                                question={q}
                                index={i}
                                nodeId={nodeId}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                    <span className="text-xs text-slate-400 dark:text-white/30">
                        {questions.length} שאלות
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                        סגור
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizEditorModal;
