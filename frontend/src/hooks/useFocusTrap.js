import { useEffect } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal behaviour shared by every dialog:
 *  - moves focus into the panel when it opens
 *  - restores focus to the previously-focused element on close
 *  - closes on Escape
 *  - traps Tab/Shift+Tab focus within the panel
 *
 * @param {React.RefObject} panelRef  ref on the dialog panel element
 * @param {boolean} isOpen
 * @param {() => void} onClose
 */
export default function useFocusTrap(panelRef, isOpen, onClose) {
    // Move focus in on open, restore it on close.
    useEffect(() => {
        if (!isOpen) return undefined;
        const previouslyFocused = document.activeElement;
        const t = setTimeout(() => panelRef.current?.focus(), 50);
        return () => {
            clearTimeout(t);
            previouslyFocused?.focus?.();
        };
    }, [isOpen, panelRef]);

    // Esc to close + tab focus trap.
    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKey = (e) => {
            if (e.key === 'Escape') { onClose?.(); return; }
            if (e.key !== 'Tab') return;
            const focusable = panelRef.current?.querySelectorAll(FOCUSABLE);
            if (!focusable?.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose, panelRef]);
}
