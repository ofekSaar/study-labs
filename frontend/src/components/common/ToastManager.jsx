import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Zap, Medal, X } from 'lucide-react';
import useToastStore from '../../store/toastStore';

const TOAST_STYLES = {
    success: {
        bg: 'bg-emerald-500',
        border: 'border-emerald-400/50',
        icon: <CheckCircle2 size={20} className="text-white" />,
    },
    error: {
        bg: 'bg-red-500',
        border: 'border-red-400/50',
        icon: <XCircle size={20} className="text-white" />,
    },
    info: {
        bg: 'bg-indigo-500',
        border: 'border-indigo-400/50',
        icon: <Info size={20} className="text-white" />,
    },
    xp: {
        bg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
        border: 'border-purple-400/50',
        icon: <Zap size={20} className="text-white fill-white/30" />,
    },
    badge: {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
        border: 'border-amber-400/50',
        icon: <Medal size={20} className="text-white" />,
    },
};

const Toast = ({ toast }) => {
    const { removeToast } = useToastStore();
    const [progress, setProgress] = useState(100);
    const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
            setProgress(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 30);
        return () => clearInterval(interval);
    }, [toast.duration]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`relative w-80 rounded-2xl shadow-2xl overflow-hidden border ${style.border}`}
        >
            {/* Background */}
            <div className={`${style.bg} p-4 flex items-start gap-3`}>
                {/* Icon or custom emoji */}
                <div className="flex-shrink-0 mt-0.5">
                    {toast.icon ? (
                        <span className="text-xl">{toast.icon}</span>
                    ) : style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-sm leading-tight">{toast.title}</p>
                    {toast.message && (
                        <p className="text-white/80 text-xs mt-0.5 leading-tight">{toast.message}</p>
                    )}
                </div>

                {/* Dismiss */}
                <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 text-white/60 hover:text-white transition-colors mt-0.5"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-black/20">
                <div
                    className="h-full bg-white/40 transition-none rounded-full"
                    style={{ width: `${progress}%`, transition: 'width 30ms linear' }}
                />
            </div>
        </motion.div>
    );
};

const ToastManager = () => {
    const { toasts } = useToastStore();

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast toast={toast} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastManager;
