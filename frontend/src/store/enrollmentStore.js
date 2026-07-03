import { create } from 'zustand';
import api from '../utils/api.js';

const useEnrollmentStore = create((set) => ({
    myEnrollments: [],
    courseEnrollments: [],
    pendingEnrollments: [],
    isLoading: false,
    error: null,

    // ── Student: Fetch my enrollment requests ──────
    fetchMyEnrollments: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.get('/api/enrollments/my');
            set({ myEnrollments: data.enrollments || [], isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    // ── Student: Request enrollment ────────────────
    requestEnrollment: async (courseId) => {
        const { data } = await api.post('/api/enrollments', { courseId });
        set((state) => ({
            myEnrollments: [data.enrollment, ...state.myEnrollments],
        }));
        return data.enrollment;
    },

    // ── Instructor: Fetch course enrollments ───────
    fetchCourseEnrollments: async (courseId, status) => {
        set({ isLoading: true, error: null });
        try {
            const query = status ? `?status=${status}` : '';
            const { data } = await api.get(`/api/enrollments/course/${courseId}${query}`);
            set({ courseEnrollments: data.enrollments || [], isLoading: false });
            return data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    // ── Instructor: Approve enrollment ─────────────
    approveEnrollment: async (enrollmentId) => {
        const { data } = await api.put(`/api/enrollments/${enrollmentId}/approve`);
        set((state) => ({
            courseEnrollments: state.courseEnrollments.map((e) =>
                e._id === enrollmentId ? { ...e, status: 'approved', respondedAt: new Date() } : e
            ),
        }));
        return data.enrollment;
    },

    // ── Instructor: Deny enrollment ────────────────
    denyEnrollment: async (enrollmentId) => {
        const { data } = await api.put(`/api/enrollments/${enrollmentId}/deny`);
        set((state) => ({
            courseEnrollments: state.courseEnrollments.map((e) =>
                e._id === enrollmentId ? { ...e, status: 'denied', respondedAt: new Date() } : e
            ),
            pendingEnrollments: state.pendingEnrollments.filter((e) => e._id !== enrollmentId),
        }));
        return data.enrollment;
    },

    // ── Instructor: Fetch all pending enrollments across courses ───
    fetchPendingEnrollments: async () => {
        try {
            const { data } = await api.get('/api/enrollments/pending-all');
            set({ pendingEnrollments: data.enrollments || [] });
            return data.enrollments || [];
        } catch (error) {
            console.error('Failed to fetch pending enrollments', error);
            return [];
        }
    },

    // ── Instructor: Approve from pending list ──────
    approvePendingEnrollment: async (enrollmentId) => {
        const { data } = await api.put(`/api/enrollments/${enrollmentId}/approve`);
        set((state) => ({
            pendingEnrollments: state.pendingEnrollments.filter((e) => e._id !== enrollmentId),
            courseEnrollments: state.courseEnrollments.map((e) =>
                e._id === enrollmentId ? { ...e, status: 'approved', respondedAt: new Date() } : e
            ),
        }));
        return data.enrollment;
    },

    // ── Instructor: Deny from pending list ─────────
    denyPendingEnrollment: async (enrollmentId) => {
        const { data } = await api.put(`/api/enrollments/${enrollmentId}/deny`);
        set((state) => ({
            pendingEnrollments: state.pendingEnrollments.filter((e) => e._id !== enrollmentId),
            courseEnrollments: state.courseEnrollments.map((e) =>
                e._id === enrollmentId ? { ...e, status: 'denied', respondedAt: new Date() } : e
            ),
        }));
        return data.enrollment;
    },

    // ── Instructor: Add student directly ──────────
    addStudentToCourse: async (courseId, studentEmail) => {
        const { data } = await api.post('/api/enrollments/add-student', { courseId, studentEmail });
        return data.enrollment;
    },
}));

export default useEnrollmentStore;
