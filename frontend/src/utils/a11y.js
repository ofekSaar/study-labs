/**
 * Accessibility helpers for non-native interactive elements.
 *
 * When a `<div>`/`<motion.div>` must stay a div (e.g. for layout animations)
 * but behaves like a button, spread `clickableProps()` onto it so it is
 * reachable and operable by keyboard and announced correctly to screen readers.
 *
 *   <motion.div {...clickableProps(onClick, 'Open course')}>…</motion.div>
 *
 * Adds: role="button", tabIndex, and Enter/Space activation.
 */
export const clickableProps = (onClick, label) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick,
    onKeyDown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(e);
        }
    },
});
