import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import api from '../../utils/api';
import useToastStore from '../../store/toastStore';
import BaseModal from '../common/BaseModal';

const StarRating = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                className="transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
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
        <BaseModal isOpen={isOpen} onClose={onClose} title="Rate this Course" subtitle={courseTitle} size="md" bodyClassName="">
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
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-grad-gold"
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <><Send size={14} /> Submit Review</>
                    )}
                </button>
            </form>
        </BaseModal>
    );
};

export default ReviewModal;
