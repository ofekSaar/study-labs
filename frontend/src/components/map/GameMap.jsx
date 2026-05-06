import React, { useRef, useEffect, useState } from 'react';

const MapNode = ({ status, x, y, label, onClick, index }) => {
    const getStyles = () => {
        switch (status) {
            case 'completed':
                return 'bg-accent-green text-white shadow-lg shadow-green-200';
            case 'active':
                return 'bg-accent-yellow text-white ring-4 ring-yellow-100 animate-pulse';
            case 'locked':
            default:
                return 'bg-gray-400 text-gray-200';
        }
    };

    return (
        <div
            className="absolute flex flex-col items-center gap-2 transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: x, top: y }}
        >
            <button
                onClick={onClick}
                disabled={status === 'locked'}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 font-bold text-lg ${getStyles()}`}
            >
                {index + 1}
            </button>

            <span className={`text-xs font-bold px-2 py-1 rounded bg-white/90 backdrop-blur-sm text-gray-700 max-w-[120px] text-center shadow-sm ${status === 'locked' ? 'opacity-50' : 'opacity-100'}`}>
                {label}
            </span>
        </div>
    );
};

const GameMapComponent = ({ nodes }) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Calculate dimensions and path based on nodes
    // We want a vertical winding path.
    // Amplitude: how wide the sine wave is
    // Frequency: how often it turns
    const NODE_SPACING = 120; // Vertical distance between nodes
    const PATH_AMPLITUDE = 100; // Horizontal swing
    const BASE_PADDING_TOP = 80;

    const totalHeight = Math.max(600, nodes.length * NODE_SPACING + BASE_PADDING_TOP * 2);

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: totalHeight
            });
        }
    }, [totalHeight]); // Recalculate if node count changes significantly affecting height

    // Generate SVG Path
    // Move to start, then curve to each node
    const generatePath = () => {
        if (dimensions.width === 0) return '';

        const centerX = dimensions.width / 2;
        let d = `M ${centerX} ${totalHeight - 40}`; // Start from bottom center roughly

        // We can draw a sine wave going up
        // Or just simple curves between nodes if we calculate their positions first
        // Let's calculate positions first
        return d;
    };

    // Pre-calculate node positions
    const configuredNodes = nodes.map((node, index) => {
        if (dimensions.width === 0) return { ...node, px: 0, py: 0 };

        const reversedIndex = nodes.length - 1 - index; // 0 at bottom, N at top usually? 
        // Actually typically games go Bottom -> Top or Top -> Bottom. 
        // Let's assume Top -> Bottom for scroll (HTML) but visual progression is often Bottom -> Top in Candy Crush style.
        // The "Learning Path" usually starts at the top (Level 1) and goes down? 
        // Or starts bottom (Level 1) and climbs up?
        // Let's stick to standard web Scroll Down -> Progress Forward.
        // So Level 1 at TOP.

        const centerY = BASE_PADDING_TOP + index * NODE_SPACING;
        const centerX = dimensions.width / 2;
        const offset = Math.sin(index * 2.5) * PATH_AMPLITUDE; // Sine wave zig zag

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

            // Cubic bezier for smooth curve
            const cpY = (curr.py + next.py) / 2;

            d += ` C ${curr.px} ${cpY}, ${next.px} ${cpY}, ${next.px} ${next.py}`;
        }
        return d;
    };

    return (
        <div
            className="relative w-full overflow-hidden bg-gray-50 rounded-3xl shadow-sm border border-gray-200"
            style={{ height: '600px' }} // Visible viewport height
        >
            <div
                ref={containerRef}
                className="absolute inset-x-0 overflow-y-auto h-full scrollbar-hide custom-scrollbar"
            >
                <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
                    {/* Path */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                        <path
                            d={getPathD()}
                            fill="none"
                            stroke="#374151"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray="20 20"
                            className="opacity-50"
                        />
                    </svg>

                    {/* Nodes */}
                    {configuredNodes.map((node, index) => (
                        <MapNode
                            key={index}
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
