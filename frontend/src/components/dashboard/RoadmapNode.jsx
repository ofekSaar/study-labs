import React from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Star, Play } from 'lucide-react';

const RoadmapNode = ({ node, index, onClick, alignment, isSelected }) => {
    const isCompleted = node.status === 'completed';
    const isCurrent = node.status === 'current';
    const isLocked = node.status === 'locked';

    // Node Variant Styles
    const getNodeStyles = () => {
        if (isCompleted) return 'bg-emerald-500 border-emerald-600 shadow-emerald-200';
        if (isCurrent) return 'bg-studylabs-blue border-blue-600 ring-4 ring-blue-100 scale-110 z-10';
        return 'bg-gray-200 border-gray-300 grayscale';
    };

    return (
        <div className="relative group">
            {/* Text Label - Absolute relative to the button center */}
            <div
                className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-60 transition-opacity duration-300 ${isSelected ? 'opacity-0' : 'opacity-100'
                    } ${alignment === 'left' ? 'right-full mr-6 text-right' : 'left-full ml-6 text-left'}`}
            >
                <h3 className={`font-bold text-base leading-tight ${isLocked ? 'text-gray-400' : 'text-gray-900 group-hover:text-studylabs-blue transition-colors'}`}>{node.title}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">{node.type}</p>
            </div>

            {/* The Node Itself */}
            <motion.button
                whileHover={!isLocked ? { scale: 1.15 } : {}}
                whileTap={!isLocked ? { scale: 0.95 } : {}}
                onClick={!isLocked ? onClick : undefined}
                className={`
                    relative w-20 h-20 rounded-full border-b-4 shadow-lg flex items-center justify-center transition-all duration-300 z-20
                    ${getNodeStyles()}
                    ${isCurrent ? 'animate-bounce-subtle' : ''}
                `}
            >
                {/* Icon inside Node */}
                {isCompleted && <Check className="text-white w-8 h-8 font-bold" strokeWidth={4} />}
                {isLocked && <Lock className="text-gray-400 w-8 h-8" />}
                {isCurrent && <Play className="text-white w-8 h-8 fill-white ml-1" />}

                {/* Star Rating (if completed) */}
                {isCompleted && (
                    <div className="absolute -top-4 flex gap-1 bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-100">
                        {[1, 2, 3].map(i => (
                            <Star key={i} size={10} className="fill-yellow-400 text-yellow-500" />
                        ))}
                    </div>
                )}
            </motion.button>

            {/* Mobile Title (Below Node) */}
            <div className="md:hidden absolute top-24 left-1/2 -translate-x-1/2 text-center w-32">
                <h3 className={`font-bold text-sm ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>{node.title}</h3>
            </div>
        </div>
    );
};

export default RoadmapNode;
