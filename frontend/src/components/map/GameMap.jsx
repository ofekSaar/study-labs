import React, { useRef, useEffect, useState } from 'react';
import { BookOpen, HelpCircle, Trophy, Lock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MapNode = ({ status, x, y, label, onClick, index, type, xpReward = 150 }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getStyles = () => {
        switch (status) {
            case 'completed':
                return 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-2 border-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.25)]';
            case 'active':
                return 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-indigo-700 shadow-[0_4px_15px_rgba(99,102,241,0.45)] pulse-ring scale-105';
            case 'locked':
            default:
                return 'bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-400 dark:text-white/20 cursor-not-allowed';
        }
    };

    const getIcon = () => {
        if (status === 'locked') {
            return <Lock size={20} className="stroke-[2.5]" />;
        }
        switch (type) {
            case 'quiz':
                return <HelpCircle size={22} className="stroke-[2.5]" />;
            case 'exam':
                return <Trophy size={22} className="stroke-[2.5]" />;
            case 'lesson':
            default:
                return <BookOpen size={22} className="stroke-[2.5]" />;
        }
    };

    return (
        <div
            className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: x, top: y }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Tooltip on Hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-16 p-3 rounded-2xl w-48 glass-card border border-indigo-500/20 shadow-lg text-slate-800 dark:text-white pointer-events-none z-50 text-right flex flex-col gap-1"
                        dir="rtl"
                    >
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">שלב {index + 1} • {type === 'quiz' ? 'בוחן' : type === 'exam' ? 'מבחן מסכם' : 'שיעור'}</p>
                        <p className="text-xs font-extrabold truncate">{label}</p>
                        <div className="flex items-center justify-between mt-1">
                            <span className="flex items-center gap-0.5 text-indigo-500 text-[10px] font-bold">
                                <Zap size={10} className="fill-indigo-500/10" />
                                +{xpReward} XP
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                status === 'active' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'
                            }`}>
                                {status === 'completed' ? 'הושלם' : status === 'active' ? 'זמין כעת' : 'נעול'}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={onClick}
                disabled={status === 'locked'}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 relative ${getStyles()}`}
            >
                {getIcon()}
                
                {/* Micro level indicator circle */}
                <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shadow border ${
                    status === 'completed' ? 'bg-emerald-600 border-emerald-500 text-white' :
                    status === 'active' ? 'bg-amber-500 border-amber-400 text-white' : 'bg-slate-300 dark:bg-slate-800 border-slate-400/30 text-slate-500'
                }`}>
                    {index + 1}
                </div>
            </button>

            <span className={`text-[10px] font-black mt-2 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 max-w-[120px] text-center shadow-sm truncate ${status === 'locked' ? 'opacity-40' : 'opacity-100'}`}>
                {label}
            </span>
        </div>
    );
};

const GameMapComponent = ({ nodes }) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const NODE_SPACING = 120;
    const PATH_AMPLITUDE = 85; 
    const BASE_PADDING_TOP = 80;

    const totalHeight = Math.max(600, nodes.length * NODE_SPACING + BASE_PADDING_TOP * 2);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: totalHeight
            });
        }
    }, [totalHeight, containerRef.current?.clientWidth]);

    const configuredNodes = nodes.map((node, index) => {
        if (dimensions.width === 0) return { ...node, px: 0, py: 0 };

        const centerY = BASE_PADDING_TOP + index * NODE_SPACING;
        const centerX = dimensions.width / 2;
        // Winding sine curve
        const offset = Math.sin(index * 2.5) * PATH_AMPLITUDE; 

        return {
            ...node,
            px: centerX + offset,
            py: centerY
        };
    });

    const getPathD = () => {
        if (configuredNodes.length < 2) return '';

        let d = `M ${configuredNodes[0].px} ${configuredNodes[0].py}`;

        for (let i = 0; i < configuredNodes.length - 1; i++) {
            const curr = configuredNodes[i];
            const next = configuredNodes[i + 1];
            const cpY = (curr.py + next.py) / 2;
            d += ` C ${curr.px} ${cpY}, ${next.px} ${cpY}, ${next.px} ${next.py}`;
        }
        return d;
    };

    return (
        <div
            className="relative w-full overflow-hidden bg-slate-100/50 dark:bg-slate-950/20 rounded-3xl border border-slate-200 dark:border-white/5 h-[450px] sm:h-[550px] lg:h-[650px]"
        >
            <div
                ref={containerRef}
                className="absolute inset-x-0 overflow-y-auto h-full scrollbar-hide custom-scrollbar"
            >
                <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                    {/* Path */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                        <defs>
                            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#4F6EF7" />
                                <stop offset="50%" stopColor="#7C3AED" />
                                <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                        </defs>
                        
                        {/* Background Trail Shadow */}
                        <path
                            d={getPathD()}
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="14"
                            strokeLinecap="round"
                            className="opacity-30 dark:opacity-10"
                        />
                        
                        {/* Glowing flowing active path */}
                        <path
                            d={getPathD()}
                            fill="none"
                            stroke="url(#pathGradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray="16 12"
                            className="map-path-animated opacity-85"
                        />
                    </svg>

                    {/* Nodes */}
                    {configuredNodes.map((node, index) => (
                        <MapNode
                            key={node._id || node.id || index}
                            {...node}
                            x={node.px}
                            y={node.py}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameMapComponent;
