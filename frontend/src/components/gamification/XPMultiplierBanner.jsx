import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Sparkles } from 'lucide-react';
import useGamificationStore from '../../store/gamificationStore';

const XPMultiplierBanner = () => {
    const { getXPMultiplier } = useGamificationStore();
    const { multiplier, reasons } = getXPMultiplier();

    // Only render banner if a multiplier boost is active (> 1.0)
    if (multiplier <= 1.0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative rounded-3xl overflow-hidden shadow-lg border border-amber-500/30 bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 group"
        >
            {/* Ambient sliding gloss sheen */}
            <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
                {/* Glowing Zap Icon */}
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center animate-pulse shrink-0">
                    <Zap size={22} className="text-amber-300 fill-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.8)]" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                        XP Boost Active!
                        <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-lg select-none">
                            {multiplier}x XP
                        </span>
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/80 font-bold mt-1">
                        Active Boosts: {reasons.join(' & ')}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
                <div className="flex items-center gap-1 bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 select-none">
                    <Flame size={12} className="text-orange-400 fill-orange-400" />
                    <span>Boost Active Now</span>
                    <Sparkles size={10} className="text-amber-300 animate-spin" />
                </div>
            </div>
        </motion.div>
    );
};

export default XPMultiplierBanner;
