/* global global, jest, describe, beforeAll, beforeEach, test, expect */
import { act } from 'react';
import useEnrollmentStoreModule from '../store/enrollmentStore';

const useEnrollmentStore = useEnrollmentStoreModule.default || useEnrollmentStoreModule;

// Set up global fetch mock
beforeAll(() => {
    global.fetch = jest.fn();
});

const mockFetchResponse = (payload, ok = true, status = 200) => {
    return Promise.resolve({
        ok,
        status,
        headers: {
            get: (name) => {
                if (name.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            }
        },
        json: () => Promise.resolve({ data: payload })
    });
};

const mockFetchErrorResponse = (message, status = 400) => {
    return Promise.resolve({
        ok: false,
        status,
        headers: {
            get: (name) => {
                if (name.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            }
        },
        json: () => Promise.resolve({ message })
    });
};

describe('useEnrollmentStore Zustand Store', () => {
    beforeEach(() => {
        global.fetch.mockReset();
        localStorage.clear();
        act(() => {
            useEnrollmentStore.setState({
                myEnrollments: [],
                courseEnrollments: [],
                isLoading: false,
                error: null,
            });
        });
    });

    test('should verify initial state', () => {
        const state = useEnrollmentStore.getState();
        expect(state.myEnrollments).toEqual([]);
        expect(state.courseEnrollments).toEqual([]);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
    });

    test('should fetch student enrollments successfully', async () => {
        const mockEnrollments = [
            { _id: 'e1', courseId: 'c1', status: 'approved' },
            { _id: 'e2', courseId: 'c2', status: 'pending' },
        ];

        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({ enrollments: mockEnrollments })
        );

        await act(async () => {
            await useEnrollmentStore.getState().fetchMyEnrollments();
        });

        const state = useEnrollmentStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.myEnrollments).toEqual(mockEnrollments);
        expect(state.error).toBeNull();
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/enrollments/my'),
            expect.any(Object)
        );
    });

    test('should handle failure during student enrollment fetch', async () => {
        global.fetch.mockImplementationOnce(() =>
            mockFetchErrorResponse('Failed to fetch enrollments', 500)
        );

        await act(async () => {
            await useEnrollmentStore.getState().fetchMyEnrollments();
        });

        const state = useEnrollmentStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.myEnrollments).toEqual([]);
        expect(state.error).toBe('Failed to fetch enrollments');
    });

    test('should request enrollment successfully', async () => {
        const mockEnrollment = { _id: 'new_e', courseId: 'c3', status: 'pending' };

        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({ enrollment: mockEnrollment })
        );

        let result;
        await act(async () => {
            result = await useEnrollmentStore.getState().requestEnrollment('c3');
        });

        const state = useEnrollmentStore.getState();
        expect(result).toEqual(mockEnrollment);
        expect(state.myEnrollments).toEqual([mockEnrollment]);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/enrollments'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ courseId: 'c3' }),
            })
        );
    });

    test('should fetch course enrollments successfully without status', async () => {
        const mockEnrollments = [
            { _id: 'e1', courseId: 'c1', status: 'pending' },
        ];

        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({ enrollments: mockEnrollments })
        );

        let result;
        await act(async () => {
            result = await useEnrollmentStore.getState().fetchCourseEnrollments('c1');
        });

        const state = useEnrollmentStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.courseEnrollments).toEqual(mockEnrollments);
        expect(result).toEqual({ enrollments: mockEnrollments });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/enrollments/course/c1'),
            expect.any(Object)
        );
        expect(global.fetch.mock.calls[0][0]).not.toContain('status=');
    });

    test('should fetch course enrollments successfully with status', async () => {
        const mockEnrollments = [
            { _id: 'e1', courseId: 'c1', status: 'pending' },
        ];

        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({ enrollments: mockEnrollments })
        );

        await act(async () => {
            await useEnrollmentStore.getState().fetchCourseEnrollments('c1', 'pending');
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/enrollments/course/c1?status=pending'),
            expect.any(Object)
        );
    });

    test('should handle failure during fetch course enrollments', async () => {
        global.fetch.mockImplementationOnce(() =>
            mockFetchErrorResponse('Fetch failed', 400)
        );

        await act(async () => {
            await useEnrollmentStore.getState().fetchCourseEnrollments('c1');
        });

        const state = useEnrollmentStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.courseEnrollments).toEqual([]);
        expect(state.error).toBe('Fetch failed');
    });

    test('should approve enrollment successfully', async () => {
        const initialEnrollment = { _id: 'e1', courseId: 'c1', status: 'pending' };
        act(() => {
            useEnrollmentStore.setState({ courseEnrollments: [initialEnrollment] });
        });

        const mockApprovedEnrollment = { _id: 'e1', courseId: 'c1', status: 'approved' };
        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({ enrollment: mockApprovedEnrollment })
        );

        let result;
        await act(async () => {
            result = await useEnrollmentStore.getState().approveEnrollment('e1');
        });

        const state = useEnrollmentStore.getState();
        expect(result).toEqual(mockApprovedEnrollment);
        expect(state.courseEnrollments[0].status).toBe('approved');
        expect(state.courseEnrollments[0].respondedAt).toBeInstanceOf(Date);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/enrollments/e1/approve'),
            expect.objectContaining({ method: 'PUT' })
        );
    });

    test('should deny enrollment successfully', async () => {
        const initialEnrollment = { _id: 'e1', courseId: 'c1', status: 'pending' };
        act(() => {
            useEnrollmentStore.setState({ courseEnrollments: [initialEnrollment] });
        });

        const mockDeniedEnrollment = { _id: 'e1', courseId: 'c1', status: 'denied' };
        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({ enrollment: mockDeniedEnrollment })
        );

        let result;
        await act(async () => {
            result = await useEnrollmentStore.getState().denyEnrollment('e1');
        });

        const state = useEnrollmentStore.getState();
        expect(result).toEqual(mockDeniedEnrollment);
        expect(state.courseEnrollments[0].status).toBe('denied');
        expect(state.courseEnrollments[0].respondedAt).toBeInstanceOf(Date);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/enrollments/e1/deny'),
            expect.objectContaining({ method: 'PUT' })
        );
    });
});
