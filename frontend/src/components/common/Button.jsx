import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Shared button primitive.
 *
 * Consolidates the gradient / ghost / danger button styles that were inlined
 * across the app into one accessible, consistent component.
 *
 * Props:
 *  - variant   primary | gradient | ghost | danger | subtle   (default primary)
 *  - size      sm | md | lg                                    (default md)
 *  - loading   shows a spinner and disables the button
 *  - icon      lucide icon component rendered before the label
 *  - iconAfter lucide icon component rendered after the label
 *  - fullWidth stretches to 100% width
 *  - as        render as a different element (e.g. 'a') — defaults to 'button'
 *  Any other props (onClick, type, disabled, aria-*, href…) are forwarded.
 */
const VARIANTS = {
    primary:
        'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5',
    gradient: 'btn-gradient text-white shadow-lg',
    purple: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.5)] hover:-translate-y-0.5',
    ghost: 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white',
    subtle: 'bg-transparent hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/70',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white shadow-lg shadow-red-500/25',
};

const SIZES = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-2xl',
    lg: 'px-6 py-3 text-base gap-2.5 rounded-2xl',
};

const ICON_SIZE = { sm: 14, md: 15, lg: 18 };

const Button = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconAfter: IconAfter,
    fullWidth = false,
    as: Component = 'button',
    className = '',
    disabled,
    children,
    ...props
}) => {
    const isDisabled = disabled || loading;
    const iconSize = ICON_SIZE[size] || ICON_SIZE.md;

    return (
        <Component
            type={Component === 'button' ? props.type || 'button' : undefined}
            disabled={Component === 'button' ? isDisabled : undefined}
            aria-disabled={isDisabled || undefined}
            aria-busy={loading || undefined}
            className={`inline-flex items-center justify-center font-bold transition-all
                ${VARIANTS[variant] || VARIANTS.primary} ${SIZES[size] || SIZES.md}
                ${fullWidth ? 'w-full' : ''}
                ${isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}
                ${className}`}
            {...props}
        >
            {loading ? (
                <Loader2 size={iconSize} className="animate-spin" />
            ) : (
                Icon && <Icon size={iconSize} />
            )}
            {children}
            {!loading && IconAfter && <IconAfter size={iconSize} />}
        </Component>
    );
};

export default Button;
