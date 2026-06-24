import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Send } from 'lucide-react';
import api from '../../utils/api';
import useToastStore from '../../store/toastStore';

const StarRating = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="transition-transform hover:scale-110 active:scale-95"
            >
                <Star
                    size={28}
                    className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-white/20'}
                    strokeWidth={1.5}
                />
            </button>
        ))}
    </div>
);

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const ReviewModal = ({ isOpen, onClose, courseId, courseTitle, onReviewed }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToastStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rating) return;
        setIsSubmitting(true);
        try {
            await api.post(`/api/courses/${courseId}/reviews`, { rating, comment });
            addToast({ type: 'success', title: 'Review submitted!', message: 'Thank you for your feedback.', icon: '⭐', duration: 3000 });
            onReviewed?.();
            onClose();
        } catch (err) {
            addToast({ type: 'error', title: 'Error', message: err?.data?.message || 'Failed to submit review', duration: 3000 });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/8">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                            <h2 className="text-lg font-black text-slate-800 dark:text-white">Rate this Course</h2>
                            <p className="text-sm text-slate-500 dark:text-white/40 mt-0.5 truncate">{courseTitle}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Stars */}
                            <div className="flex flex-col items-center gap-2">
                                <StarRating value={rating} onChange={setRating} />
                                <p className={`text-sm font-black transition-all duration-200 ${rating ? 'text-amber-500' : 'text-slate-400 dark:text-white/30'}`}>
                                    {RATING_LABELS[rating] || 'Tap to rate'}
                                </p>
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-2 block">
                                    Comment (optional)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Share your experience with other students..."
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:border-amber-500/50 resize-none transition-colors"
                                />
                                <p className="text-[10px] text-slate-400 dark:text-white/25 text-right mt-1">{comment.length}/500</p>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={!rating || isSubmitting}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{ background: 'linear-gradient(135deg, #F59E0B, #D97757)' }}
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <><Send size={14} /> Submit Review</>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReviewModal;
