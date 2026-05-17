import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Trophy } from 'lucide-react';
import useCourseStore from '../../store/courseStore';

const XPHeader = () => {
    const { user } = useCourseStore();

    return (
        <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 w-full z-20 px-6 py-4 flex items-center justify-end pointer-events-none"
        >
            <div className="flex items-center gap-2 pointer-events-auto rounded-2xl px-3 py-2 border border-white/10"
                style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}>

                {/* Streak */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.15)' }}>
                    <Flame size={18} className="text-orange-400 fill-orange-400" style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.8))' }} />
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-base text-white">{user?.streak ?? 0}</span>
                        <span className="text-[9px] uppercase font-bold text-orange-400 tracking-widest">Streak</span>
                    </div>
                </div>

                <div className="w-px h-6 bg-white/10" />

                {/* XP */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{ background: 'rgba(79,110,247,0.15)' }}>
                    <Zap size={18} className="text-indigo-400 fill-indigo-400" style={{ filter: 'drop-shadow(0 0 6px rgba(79,110,247,0.8))' }} />
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-base text-white">{user?.totalXP ?? 0}</span>
                        <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-widest">Total XP</span>
                    </div>
                </div>

                <div className="w-px h-6 bg-white/10" />

                {/* Trophy level */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <Trophy size={18} className="text-emerald-400" style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.7))' }} />
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-base text-white">
                            {user?.totalXP ? Math.floor(user.totalXP / 100) + 1 : 1}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-widest">Level</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default XPHeader;
