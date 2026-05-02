import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import RoadmapNode from './RoadmapNode';
import useCourseStore from '../../store/courseStore';

const RoadmapView = () => {
    const { courses, selectedCourseId, fetchCourseNodes, setSelectedNode, selectedNode } = useCourseStore();
    const course = courses.find(c => c.id === selectedCourseId);
    const [isLoadingNodes, setIsLoadingNodes] = useState(false);

    useEffect(() => {
        if (course && (!course.nodes || course.nodes.length === 0)) {
            const loadNodes = async () => {
                setIsLoadingNodes(true);
                await fetchCourseNodes(course.id);
                setIsLoadingNodes(false);
            };
            loadNodes();
        }
    }, [course?.id, fetchCourseNodes]);

    // Safety check
    if (!course) return <div className="p-8 text-center text-gray-500">Select a course to view roadmap</div>;
    if (isLoadingNodes) return <div className="p-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div></div>;

    // Constants for layout
    const NODE_HEIGHT = 120; // Vertical distance between nodes
    const AMPLITUDE = 70;   // Horizontal sway from center
    const START_Y = 60;      // Initial top padding

    // Generate Path
    const generatePath = () => {
        let path = `M 50% ${START_Y} `; // Start center top

        course.nodes.forEach((_, index) => {
            const y = START_Y + (index * NODE_HEIGHT);
            const nextY = START_Y + ((index + 1) * NODE_HEIGHT);

            // Current position (implied from previous segment end)
            // Target position for next node
            // Note: SVG path logic with mix of % and px implies we need a fixed coordinate system usually.
            // Simplified: Draw a curve from (0,0) down.
            // Let's use specific x coordinates relative to center (0).
            // But SVG inside a responsive div is tricky. 
            // Better: Use a fixed width container for the SVG (max-w-2xl is 672px). Center is 336px.

            const centerX = 336;
            const currentX = centerX + (index % 2 === 0 ? -AMPLITUDE : AMPLITUDE); // Start left, then right? Or center-based?
            // Actually, if we want a sine wave passing THROUGH the nodes:
            // Node 0: Center - Amp (Left)
            // Node 1: Center + Amp (Right)
            // Node 2: Center - Amp

            // Wait, standard Game Maps usually have nodes ON the curve.
        });
        return path;
    };

    // New Approach: 
    // We render the SVG as a background layer with known coordinates.
    // We render nodes absolutely positioned on top of those coordinates.

    return (
        <div className="relative min-h-screen pb-32">
            <div className="text-center pt-24 pb-10">
                <h2 className="text-3xl font-display font-bold text-gray-900">{course.title}</h2>
                <p className="text-gray-500 mt-2">Level: <span className="font-bold text-studylabs-blue">{course.level}</span></p>
            </div>

            {/* Container for Map */}
            <div className="relative w-full max-w-[700px] mx-auto min-h-[800px]">

                {/* SVG Path Layer */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible" xmlns="http://www.w3.org/2000/svg">
                    {/* Defs for gradients etc */}
                    <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#E0E7FF" />
                            <stop offset="100%" stopColor="#E0E7FF" />
                        </linearGradient>
                        <linearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#4F46E5" />
                        </linearGradient>
                    </defs>

                    {/* Background Guide Line */}
                    <path
                        d={course.nodes.reduce((acc, _, i) => {
                            const y = START_Y + (i * NODE_HEIGHT);
                            const prevY = START_Y + ((i - 1) * NODE_HEIGHT);
                            // CENTER_X = 350
                            const xCurr = 350 + ((i % 2 === 0 ? -1 : 1) * AMPLITUDE);

                            if (i === 0) return `M ${xCurr} ${y}`;

                            const xPrev = 350 + (((i - 1) % 2 === 0 ? -1 : 1) * AMPLITUDE);

                            // Bezier Control Points
                            const cp1x = xPrev;
                            const cp1y = prevY + (NODE_HEIGHT / 2);
                            const cp2x = xCurr;
                            const cp2y = y - (NODE_HEIGHT / 2);

                            return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xCurr} ${y}`;
                        }, '')}
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />

                    {/* Progress Line (Masked or Partial - distinct path for simplicity) */}
                    {/* For MVP, let's just make the whole path blue up to the current node index */}
                    <path
                        d={course.nodes.reduce((acc, node, i) => {
                            // If node is locked, stop drawing? 
                            // Or draw up to 'current' node + halfway to next?
                            // Let's draw up to the last completed node fully, and partially to current.

                            // Simple logic: Draw full segments if the TARGET node is completed or current.
                            if (node.status === 'locked') return acc;

                            const y = START_Y + (i * NODE_HEIGHT);
                            const prevY = START_Y + ((i - 1) * NODE_HEIGHT);
                            const xCurr = 350 + ((i % 2 === 0 ? -1 : 1) * AMPLITUDE);

                            if (i === 0) return `M ${xCurr} ${y}`;

                            const xPrev = 350 + (((i - 1) % 2 === 0 ? -1 : 1) * AMPLITUDE);
                            const cp1x = xPrev;
                            const cp1y = prevY + (NODE_HEIGHT / 2);
                            const cp2x = xCurr;
                            const cp2y = y - (NODE_HEIGHT / 2);

                            return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xCurr} ${y}`;
                        }, '')}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="10 5"
                        className="animate-pulse" // Adding a subtle animation
                    />
                </svg>

                {/* Nodes Layer */}
                <div style={{ height: (course.nodes.length * NODE_HEIGHT) + 250 }}>
                    {course.nodes.map((node, index) => {
                        const y = START_Y + (index * NODE_HEIGHT);
                        const x = 350 + ((index % 2 === 0 ? -1 : 1) * AMPLITUDE);

                        const nodeId = node._id || node.id;
                        const selectedNodeId = selectedNode?._id || selectedNode?.id;

                        return (
                            <div
                                key={nodeId}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{ left: x, top: y }}
                            >
                                <RoadmapNode
                                    node={node}
                                    index={index}
                                    onClick={() => setSelectedNode(node)}
                                    // Pass explicit position prop if needed for text alignment
                                    alignment={index % 2 === 0 ? 'left' : 'right'}
                                    isSelected={selectedNodeId === nodeId}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RoadmapView;
