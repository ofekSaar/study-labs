import React from 'react';

/**
 * Shared loading spinner.
 *
 * Consolidates the `animate-spin border-t-transparent` divs that were
 * duplicated across pages and modals into one accessible primitive.
 *
 * Props:
 *  - size      xs | sm | md | lg          (default md)
 *  - color     primary | purple | indigo | emerald | red | white  (default primary)
 *  - label     accessible name announced to screen readers (default 'Loading')
 *  - center    wraps the spinner in a centered flex container with padding
 */
const SIZES = {
    xs: 'w-3 h-3 border',
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-10 h-10 border-4',
};

const COLORS = {
    primary: 'border-studylabs-orange',
    purple: 'border-purple-500',
    indigo: 'border-indigo-500',
    emerald: 'border-emerald-500',
    red: 'border-red-500',
    white: 'border-white',
};

const Spinner = ({
    size = 'md',
    color = 'primary',
    label = 'Loading',
    center = false,
    className = '',
}) => {
    const spinner = (
        <div
            role="status"
            aria-label={label}
            className={`animate-spin rounded-full border-t-transparent shrink-0
                ${SIZES[size] || SIZES.md} ${COLORS[color] || COLORS.primary} ${className}`}
        />
    );

    if (!center) return spinner;

    return <div className="flex items-center justify-center py-20">{spinner}</div>;
};

export default Spinner;
