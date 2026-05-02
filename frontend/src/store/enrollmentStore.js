import { create } from 'zustand';
import api from '../utils/api.js';

const useEnrollmentStore = create((set, get) => ({
    myEnrollments: [],
    courseEnrollments: [],
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
        try {
            const { data } = await api.post('/api/enrollments', { courseId });
            set((state) => ({
                myEnrollments: [data.enrollment, ...state.myEnrollments],
            }));
            return data.enrollment;
        } catch (error) {
            throw error;
        }
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
        try {
            const { data } = await api.put(`/api/enrollments/${enrollmentId}/approve`);
            set((state) => ({
                courseEnrollments: state.courseEnrollments.map((e) =>
                    e._id === enrollmentId ? { ...e, status: 'approved', respondedAt: new Date() } : e
                ),
            }));
            return data.enrollment;
        } catch (error) {
            throw error;
        }
    },

    // ── Instructor: Deny enrollment ────────────────
    denyEnrollment: async (enrollmentId) => {
        try {
            const { data } = await api.put(`/api/enrollments/${enrollmentId}/deny`);
            set((state) => ({
                courseEnrollments: state.courseEnrollments.map((e) =>
                    e._id === enrollmentId ? { ...e, status: 'denied', respondedAt: new Date() } : e
                ),
            }));
            return data.enrollment;
        } catch (error) {
            throw error;
        }
    },
}));

export default useEnrollmentStore;
