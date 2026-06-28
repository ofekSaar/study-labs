import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * Animates a number from its previous value to the new one with a spring.
 * Mirrors the inline pattern used for the shop coin counter so XP / level /
 * stat numbers across the app share one consistent count-up feel.
 *
 * Honours prefers-reduced-motion: jumps straight to the value.
 *
 * Props:
 *  - value      target number
 *  - format     optional (n) => string formatter (default toLocaleString)
 *  - className  forwarded to the span
 */
const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const CountUp = ({ value = 0, format = (n) => Math.round(n).toLocaleString(), className }) => {
    const spring = useSpring(value, { stiffness: 80, damping: 18 });
    const display = useTransform(spring, format);

    useEffect(() => {
        if (prefersReduced) spring.jump(value);
        else spring.set(value);
    }, [value, spring]);

    return <motion.span className={className}>{display}</motion.span>;
};

export default CountUp;
