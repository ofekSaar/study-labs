import { create } from 'zustand';
import api from '../utils/api.js';
import useNotificationStore from './notificationStore.js';
import useToastStore from './toastStore.js';
import logger from '../utils/logger.js';

const SEEN_ANNOUNCEMENTS_KEY = 'studylabs_seen_announcements';

function getSeenIds() {
    try {
        return new Set(JSON.parse(localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY)) || []);
    } catch {
        return new Set();
    }
}

function markSeen(ids) {
    const seen = getSeenIds();
    ids.forEach((id) => seen.add(id));
    localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify([...seen]));
}

const useCourseStore = create((set, get) => ({
    user: {
        name: 'Student',
        totalXP: 0,
        streak: 0,
        levelName: 'Beginner',
        avatar: null,
    },
    instructorStats: null,
    courses: [],
    announcements: [],
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
            logger.error('Failed to fetch stats:', error);
        }
    },

    // ── Fetch enrolled courses ─────────────────────
    fetchCourses: async () => {
        // Stale-while-revalidate: when courses are already cached, keep showing
        // them and refresh silently instead of flipping the page to a skeleton.
        const isRefresh = get().courses.length > 0;
        if (!isRefresh) set({ isLoading: true, error: null });

        try {
            const { data } = await api.get('/api/courses?view=student');
            const courses = data.courses || [];

            // Progress ships embedded in the course list, so no per-course requests.
            const enrichedCourses = courses
                .filter((c) => c.enrollmentStatus === 'approved' || c.enrollmentStatus === 'active')
                .map((course) => {
                    const cached = get().courses.find(
                        (c) => c.id === course._id || c._id === course._id
                    );
                    return {
                        ...course,
                        id: course._id,
                        progress: course.progress?.percentComplete || 0,
                        totalXP: course.progress?.totalXP || 0,
                        level: course.level || 'Beginner',
                        color: course.color || 'bg-studylabs-blue',
                        // A refresh must not blank out a roadmap that's on screen.
                        nodes: cached?.nodes || [],
                    };
                });

            set((state) => ({
                courses: enrichedCourses,
                // Keep the user's selection when it survives the refresh.
                selectedCourseId: enrichedCourses.some((c) => c.id === state.selectedCourseId)
                    ? state.selectedCourseId
                    : (enrichedCourses[0]?.id ?? null),
                isLoading: false,
            }));
        } catch (error) {
            if (isRefresh) {
                // Keep showing cached data when a background refresh fails.
                logger.error('Failed to refresh courses:', error);
            } else {
                set({ error: error.message, isLoading: false });
            }
        }
    },

    // ── Fetch instructor-specific stats ───────────
    fetchInstructorStats: async () => {
        try {
            const { data } = await api.get('/api/instructor/stats');
            set({ instructorStats: data });
        } catch (error) {
            logger.error('Failed to fetch instructor stats:', error);
        }
    },

    // ── Fetch all courses for instructor ───────────
    fetchAllCourses: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.get('/api/courses?view=instructor');
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
            const nodes = data.nodes || [];
            const courseMeta = data.course || {};

            set((state) => {
                const exists = state.courses.some((c) => c.id === courseId || c._id === courseId);

                // Generation metadata travels with the course payload — keep it in sync so the
                // failed/generating states (and the retry button) render on a direct page load.
                const genMeta = {
                    generationStatus: courseMeta.generationStatus,
                    generationError: courseMeta.generationError,
                    generationProgress: courseMeta.generationProgress,
                    generationAttempts: courseMeta.generationAttempts,
                };

                if (exists) {
                    // Update existing course with fetched nodes
                    return {
                        courses: state.courses.map((c) =>
                            c.id === courseId || c._id === courseId
                                ? { ...c, ...genMeta, nodes }
                                : c
                        ),
                    };
                } else {
                    // Course not in store yet — add it with the metadata from the response
                    return {
                        courses: [
                            ...state.courses,
                            {
                                id: courseId,
                                _id: courseId,
                                title: courseMeta.title || 'Untitled Course',
                                level: courseMeta.level || 'Beginner',
                                color: courseMeta.color || 'bg-studylabs-blue',
                                progress: 0,
                                ...genMeta,
                                nodes,
                            },
                        ],
                    };
                }
            });
            return data;
        } catch (error) {
            logger.error('Failed to fetch nodes:', error);
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
                            if (data.nextNode && node._id === data.nextNode._id)
                                return { ...node, status: 'current' };
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
            logger.error('Failed to complete node:', error);
            throw error;
        }
    },

    updateCourse: async (courseId, updates) => {
        const { data } = await api.put(`/api/courses/${courseId}`, updates);
        const updated = data.course;
        set((state) => ({
            courses: state.courses.map((c) =>
                c.id === courseId || c._id === courseId
                    ? { ...c, ...updated, id: c.id || c._id }
                    : c
            ),
        }));
        return updated;
    },

    deleteCourse: async (courseId) => {
        try {
            await api.delete(`/api/courses/${courseId}`);
            set((state) => ({
                courses: state.courses.filter((c) => c.id !== courseId && c._id !== courseId),
                selectedCourseId:
                    state.selectedCourseId === courseId ? null : state.selectedCourseId,
            }));
        } catch (error) {
            logger.error('Failed to delete course:', error);
            throw error;
        }
    },

    // ── Announcements ──────────────────────────────
    fetchAnnouncements: async (courseId, courseTitle) => {
        try {
            const { data } = await api.get(`/api/courses/${courseId}/announcements`);
            const announcements = data.announcements || [];
            set({ announcements });

            const seen = getSeenIds();
            const newOnes = announcements.filter((a) => !seen.has(a._id));
            if (newOnes.length > 0) {
                const { addNotification } = useNotificationStore.getState();
                const { addToast } = useToastStore.getState();
                newOnes.forEach((ann) => {
                    addNotification({
                        type: 'announcement',
                        courseId,
                        courseTitle: courseTitle || ann.courseName || '',
                        message: ann.title,
                        createdAt: ann.createdAt || new Date().toISOString(),
                    });
                    addToast({
                        type: 'info',
                        title: courseTitle || ann.courseName || 'New Announcement',
                        message: ann.title,
                        icon: '📢',
                        duration: 5000,
                    });
                });
                markSeen(newOnes.map((a) => a._id));
            }
        } catch (error) {
            logger.error('Failed to fetch announcements:', error);
        }
    },

    createAnnouncement: async (courseId, payload) => {
        const { data } = await api.post(`/api/courses/${courseId}/announcements`, payload);
        set((state) => ({
            announcements: [data.announcement, ...state.announcements].sort(
                (a, b) =>
                    (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) ||
                    new Date(b.createdAt) - new Date(a.createdAt)
            ),
        }));
        return data.announcement;
    },

    deleteAnnouncement: async (courseId, announcementId) => {
        await api.delete(`/api/courses/${courseId}/announcements/${announcementId}`);
        set((state) => ({
            announcements: state.announcements.filter((a) => a._id !== announcementId),
        }));
    },

    // ── Retry a failed/stuck course generation ─────
    regenerateCourse: async (courseId) => {
        try {
            const { data } = await api.post(`/api/courses/${courseId}/regenerate`);
            // Flip the course back to 'generating' so CourseMap's poller resumes.
            set((state) => ({
                courses: state.courses.map((c) =>
                    c.id === courseId || c._id === courseId
                        ? {
                              ...c,
                              generationStatus: 'generating',
                              generationError: null,
                              generationProgress: 'Restarting AI generation...',
                              generationAttempts:
                                  data?.generationAttempts ?? (c.generationAttempts || 1) + 1,
                              nodes: [],
                          }
                        : c
                ),
            }));
            return data;
        } catch (error) {
            logger.error('Failed to regenerate course:', error);
            throw error;
        }
    },
}));

export default useCourseStore;
