import { create } from 'zustand';
import api from '../utils/api.js';

const useCourseStore = create((set, get) => ({
    user: {
        name: 'Student',
        totalXP: 0,
        streak: 0,
        levelName: 'Beginner',
        avatar: null,
    },
    courses: [],
    selectedCourseId: null,
    selectedNode: null,
    isLoading: false,
    error: null,

    // ── Fetch student stats ────────────────────────
    fetchStats: async () => {
        try {
            const { data } = await api.get('/api/progress/stats');
            set((state) => ({
                user: {
                    ...state.user,
                    totalXP: data.totalXP,
                    streak: data.streak,
                    levelName: data.levelName,
                },
            }));
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    },

    // ── Fetch enrolled courses ─────────────────────
    fetchCourses: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.get('/api/courses');
            const courses = data.courses || [];

            // For each enrolled course, fetch progress
            const enrichedCourses = await Promise.all(
                courses
                    .filter((c) => c.enrollmentStatus === 'approved')
                    .map(async (course) => {
                        try {
                            const progressRes = await api.get(`/api/progress/course/${course._id}`);
                            const progress = progressRes.data.progress;
                            return {
                                ...course,
                                id: course._id,
                                progress: progress.percentComplete || 0,
                                totalXP: progress.totalXP || 0,
                                level: course.level || 'Beginner',
                                color: course.color || 'bg-studylabs-blue',
                                nodes: [], // Loaded on demand
                            };
                        } catch {
                            return {
                                ...course,
                                id: course._id,
                                progress: 0,
                                totalXP: 0,
                                level: course.level || 'Beginner',
                                color: course.color || 'bg-studylabs-blue',
                                nodes: [],
                            };
                        }
                    })
            );

            set({
                courses: enrichedCourses,
                selectedCourseId: enrichedCourses.length > 0 ? enrichedCourses[0].id : null,
                isLoading: false,
            });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    // ── Fetch all courses for instructor ───────────
    fetchAllCourses: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.get('/api/courses');
            const courses = (data.courses || []).map((course) => ({
                ...course,
                id: course._id,
                progress: 0,
                level: course.level || 'Beginner',
                color: course.color || 'bg-studylabs-blue',
                nodes: [],
            }));
            set({ courses, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    // ── Fetch course nodes ─────────────────────────
    fetchCourseNodes: async (courseId) => {
        try {
            const { data } = await api.get(`/api/courses/${courseId}/nodes`);
            // Update the course in state with nodes
            set((state) => ({
                courses: state.courses.map((c) =>
                    c.id === courseId
                        ? { ...c, nodes: data.nodes || [] }
                        : c
                ),
            }));
            return data;
        } catch (error) {
            console.error('Failed to fetch nodes:', error);
            return null;
        }
    },

    // ── Actions ────────────────────────────────────
    setSelectedCourse: (courseId) => set({ selectedCourseId: courseId, selectedNode: null }),
    setSelectedNode: (node) => set({ selectedNode: node }),
    closeDrawer: () => set({ selectedNode: null }),

    completeNode: async (courseId, nodeId) => {
        try {
            const { data } = await api.post('/api/progress/complete-node', { courseId, nodeId });
            // Update local state
            set((state) => ({
                courses: state.courses.map((course) => {
                    if (course.id !== courseId) return course;
                    return {
                        ...course,
                        progress: data.percentComplete,
                        nodes: course.nodes.map((node) => {
                            if (node._id === nodeId) return { ...node, status: 'completed' };
                            if (data.nextNode && node._id === data.nextNode._id) return { ...node, status: 'current' };
                            return node;
                        }),
                    };
                }),
                user: {
                    ...state.user,
                    totalXP: state.user.totalXP + data.xpEarned,
                },
            }));
            return data;
        } catch (error) {
            console.error('Failed to complete node:', error);
            throw error;
        }
    },
}));

export default useCourseStore;
