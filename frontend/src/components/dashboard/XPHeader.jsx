import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Trophy } from 'lucide-react';
import useCourseStore from '../../store/courseStore';

const XPHeader = () => {
    const { user } = useCourseStore();

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-0 w-full z-20 px-6 py-4 flex items-center justify-end pointer-events-none"
        >
            <div className="flex items-center gap-6 pointer-events-auto bg-white/50 backdrop-blur-sm p-2 rounded-2xl shadow-sm border border-white/50">
                {/* Streak */}
                <div className="flex items-center gap-2 text-orange-500">
                    <Flame className="fill-orange-500" size={20} />
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-lg">{user.streak}</span>
                        <span className="text-[10px] uppercase font-bold text-orange-400">Day Streak</span>
                    </div>
                </div>

                {/* XP */}
                <div className="flex items-center gap-2 text-studylabs-blue">
                    <Zap className="fill-studylabs-blue" size={20} />
                    <div className="flex flex-col leading-none">
                        <span className="font-bold text-lg">{user.totalXP}</span>
                        <span className="text-[10px] uppercase font-bold text-blue-400">Total XP</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default XPHeader;
