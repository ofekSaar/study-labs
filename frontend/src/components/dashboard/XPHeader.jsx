import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Zap, Flame, Trophy } from 'lucide-react';
import useCourseStore from '../../store/courseStore';

const AnimatedNumber = ({ value }) => {
    const mv = useMotionValue(value);
    const display = useTransform(mv, (v) => Math.round(v).toLocaleString());

    useEffect(() => {
        const controls = animate(mv, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
        return controls.stop;
    }, [value]); // eslint-disable-line

    return <motion.span>{display}</motion.span>;
};

const XPHeader = () => {
    const { user } = useCourseStore();
    const level = user?.totalXP ? Math.floor(user.totalXP / 100) + 1 : 1;

    return (
        <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 w-full z-20 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-end pointer-events-none"
        >
            <div
                className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto rounded-2xl px-2 sm:px-2.5 py-2"
                style={{
                    background: 'rgba(10, 8, 6, 0.82)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
            >
                {/* Streak */}
                <div
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl"
                    style={{
                        background: 'rgba(249,115,22,0.18)',
                        boxShadow:
                            '0 0 16px rgba(249,115,22,0.15), inset 0 1px 0 rgba(249,115,22,0.2)',
                    }}
                >
                    <Flame
                        size={20}
                        className="text-orange-400 fill-orange-400 fire-flicker"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.9))' }}
                    />
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-lg text-white tabular-nums">
                            <AnimatedNumber value={user?.streak ?? 0} />
                        </span>
                        <span className="text-[8px] uppercase font-black text-orange-400 tracking-widest mt-0.5">
                            Streak
                        </span>
                    </div>
                </div>

                <div className="w-px h-8 bg-white/8" />

                {/* XP */}
                <div
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl"
                    style={{
                        background: 'rgba(245,158,11,0.15)',
                        boxShadow:
                            '0 0 16px rgba(245,158,11,0.12), inset 0 1px 0 rgba(245,158,11,0.2)',
                    }}
                >
                    <Zap
                        size={20}
                        className="text-amber-400 fill-amber-400"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.9))' }}
                    />
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-lg text-white tabular-nums">
                            <AnimatedNumber value={user?.totalXP ?? 0} />
                        </span>
                        <span className="text-[8px] uppercase font-black text-amber-400 tracking-widest mt-0.5">
                            Total XP
                        </span>
                    </div>
                </div>

                <div className="w-px h-8 bg-white/8" />

                {/* Level */}
                <div
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl"
                    style={{
                        background: 'rgba(16,185,129,0.15)',
                        boxShadow:
                            '0 0 16px rgba(16,185,129,0.12), inset 0 1px 0 rgba(16,185,129,0.2)',
                    }}
                >
                    <Trophy
                        size={20}
                        className="text-emerald-400"
                        style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.9))' }}
                    />
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-lg text-white tabular-nums">
                            <AnimatedNumber value={level} />
                        </span>
                        <span className="text-[8px] uppercase font-black text-emerald-400 tracking-widest mt-0.5">
                            Level
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default XPHeader;
