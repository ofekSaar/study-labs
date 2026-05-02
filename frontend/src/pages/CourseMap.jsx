import React from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import InstructorLayout from '../components/layout/InstructorLayout';
import GameMapComponent from '../components/map/GameMap';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const CourseMap = () => {
    const navigate = useNavigate();
    const { role } = useAuthStore();
    const Layout = role === 'instructor' ? InstructorLayout : StudentLayout;

    // Expanded Data with Locked/Unlocked Stages
    const nodes = [
        { status: 'completed', label: 'Introduction' },
        { status: 'completed', label: 'Big O Notation' },
        { status: 'completed', label: 'Arrays & Strings' },
        { status: 'active', label: 'Linked Lists', onClick: () => navigate('/lesson/1/quiz') }, // Current Level
        { status: 'locked', label: 'Stacks & Queues' },
        { status: 'locked', label: 'Recursion' },
        { status: 'locked', label: 'Binary Trees' },
        { status: 'locked', label: 'BST Operations' },
        { status: 'locked', label: 'Heaps' },
        { status: 'locked', label: 'Hash Maps' },
        { status: 'locked', label: 'Final Project' },
    ];

    return (
        <Layout title="Data Structures">
            <div className="min-h-screen md:min-h-0 bg-studylabs-blue md:bg-transparent md:text-gray-900">

                {/* Mobile-only Course Header */}
                <div className="md:hidden px-6 py-6 flex items-center justify-between text-white">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-display font-bold text-xl">Data Structures</h1>
                    <div className="w-10" />
                </div>

                {/* Content Container */}
                <div className="bg-studylabs-blue md:bg-white md:rounded-3xl md:p-8 md:shadow-sm">

                    {/* Streak Banner */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-accent-yellow/20 backdrop-blur-md md:bg-orange-50 px-6 py-2 rounded-full border border-accent-yellow/50 md:border-orange-100 flex items-center gap-2">
                            <span className="text-accent-yellow md:text-orange-600 font-bold">Daily Streak</span>
                            <span className="text-2xl">🔥</span>
                        </div>
                    </div>

                    {/* Map Container - Centered and Contained on Desktop */}
                    <div className="px-4 pb-20 md:pb-0 max-w-xl mx-auto">
                        <GameMapComponent nodes={nodes} />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CourseMap;
