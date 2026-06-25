import React from 'react';

/**
 * A card wrapped in a 1px gradient border. Replaces the repeated
 * `<div class="p-px rounded-..." style={{ background: gradient }}>
 *    <div class="bg-white ... rounded-...">` pattern.
 *
 * Props:
 *  - gradient   one of the .bg-grad-* utility classes (default primary), or
 *               pass `gradientStyle` for a custom inline gradient.
 *  - radius     tailwind rounded class for the outer border (default rounded-2xl)
 *  - innerClassName  classes for the inner content surface
 */
const GradientBorderCard = ({
    children,
    gradient = 'bg-grad-primary',
    gradientStyle,
    radius = 'rounded-2xl',
    innerRadius = 'rounded-[15px]',
    className = '',
    innerClassName = 'bg-white dark:bg-slate-900 p-4',
    ...rest
}) => (
    <div
        className={`p-px ${radius} ${gradientStyle ? '' : gradient} ${className}`}
        style={gradientStyle ? { background: gradientStyle } : undefined}
    >
        <div className={`${innerRadius} ${innerClassName}`} {...rest}>
            {children}
        </div>
    </div>
);

export default GradientBorderCard;
