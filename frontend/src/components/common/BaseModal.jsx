import React, { useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';

const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

/**
 * Shared modal shell: backdrop + spring panel + focus trap + Esc handling.
 *
 * Replaces the boilerplate that was duplicated across every modal in the app.
 * Renders nothing when `isOpen` is false (the AnimatePresence handles the
 * exit animation before unmount).
 *
 * Props:
 *  - isOpen, onClose
 *  - title, subtitle    optional header content (omit `title` for a headerless modal)
 *  - children           modal body (already padded; pass `bodyClassName=""` to opt out)
 *  - footer             optional footer node
 *  - size               sm | md | lg | xl | 2xl  (default md)
 *  - closeOnBackdrop    default true
 *  - panelClassName     extra classes for the panel (e.g. custom bg for celebration modals)
 *  - bodyClassName      override default body padding/scroll
 *  - hideClose          hide the X button in the header
 */
const BaseModal = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    size = 'md',
    closeOnBackdrop = true,
    panelClassName = '',
    bodyClassName = 'p-6',
    hideClose = false,
}) => {
    const panelRef = useRef(null);
    const titleId = useId();

    useFocusTrap(panelRef, isOpen, onClose);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeOnBackdrop ? onClose : undefined}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
                    />

                    <motion.div
                        ref={panelRef}
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className={`relative z-10 w-full ${SIZES[size] || SIZES.md} bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-[88vh] flex flex-col outline-none ${panelClassName}`}
                    >
                        {(title || !hideClose) && (
                            <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/8 flex items-start justify-between gap-4 shrink-0">
                                <div className="min-w-0">
                                    {title && (
                                        <h2 id={titleId} className="text-lg font-black text-slate-800 dark:text-white truncate">
                                            {title}
                                        </h2>
                                    )}
                                    {subtitle && (
                                        <p className="text-sm text-slate-500 dark:text-white/40 mt-0.5 truncate">{subtitle}</p>
                                    )}
                                </div>
                                {!hideClose && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Close dialog"
                                        className="shrink-0 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div className={`flex-1 overflow-y-auto custom-scrollbar ${bodyClassName}`}>
                            {children}
                        </div>

                        {footer && (
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-black/10 shrink-0">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BaseModal;
