import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

/**
 * Animates a number to its target with a spring. On mount it counts up from
 * `from` (default 0) so dashboard stats roll in on load; on later changes it
 * springs from the previous value. Shares the feel of the shop coin counter.
 *
 * Honours prefers-reduced-motion: jumps straight to the value, no animation.
 *
 * Props:
 *  - value      target number
 *  - from       starting number for the mount animation (default 0)
 *  - format     optional (n) => string formatter (default toLocaleString)
 *  - className  forwarded to the span
 */
const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const CountUp = ({ value = 0, from = 0, format = (n) => Math.round(n).toLocaleString(), className }) => {
    const spring = useSpring(prefersReduced ? value : from, { stiffness: 80, damping: 18 });
    const display = useTransform(spring, format);

    useEffect(() => {
        if (prefersReduced) spring.jump(value);
        else spring.set(value);
    }, [value, spring]);

    return <motion.span className={className}>{display}</motion.span>;
};

export default CountUp;
