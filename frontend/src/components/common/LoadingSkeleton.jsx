import React from 'react';

/**
 * Reusable shimmer skeleton. Uses the .shimmer CSS class from index.css
 * which already has dark-mode and prefers-reduced-motion support.
 *
 * @param {number}   rows      - number of skeleton rows to render (default 3)
 * @param {string}   className - extra classes on the wrapper
 * @param {object[]} heights   - optional array of Tailwind height classes per row
 *                               e.g. ['h-8', 'h-4', 'h-4']. Defaults to alternating h-5/h-4.
 */
const LoadingSkeleton = ({ rows = 3, className = '', heights }) => {
    const defaultHeights = Array.from({ length: rows }, (_, i) => (i === 0 ? 'h-5' : 'h-4'));
    const rowHeights = heights ?? defaultHeights;

    return (
        <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="Loading…">
            {rowHeights.map((h, i) => (
                <div
                    key={i}
                    className={`shimmer ${h} rounded-xl ${i > 0 ? 'w-4/5' : 'w-full'}`}
                    style={{ opacity: 1 - i * 0.12 }}
                />
            ))}
        </div>
    );
};

export default LoadingSkeleton;
