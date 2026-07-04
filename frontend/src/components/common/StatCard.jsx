import React from 'react';
import { motion } from 'framer-motion';

/**
 * Compact stat tile used on the dashboard and elsewhere.
 *
 * Props:
 *  - icon   lucide icon component
 *  - value  the number/string to highlight
 *  - label  small uppercase caption
 *  - color  tailwind bg-* class used for the subtle hover wash
 *  - glow   className applied to the icon (color + drop-shadow glow)
 */
const StatCard = ({ icon: Icon, value, label, color = 'bg-orange-500', glow = '' }) => (
    <motion.div
        whileHover={{ y: -3, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1 shadow-sm relative overflow-hidden group cursor-default"
    >
        <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${color} rounded-2xl`}
            style={{ opacity: 0.04 }}
        />
        {Icon && <Icon size={20} className={glow} />}
        <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
            {value}
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
            {label}
        </span>
    </motion.div>
);

export default StatCard;
