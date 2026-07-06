import { act } from 'react';
import useCourseStoreModule from '../store/courseStore';

const useCourseStore = useCourseStoreModule.default || useCourseStoreModule;

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
            },
        },
        json: () => Promise.resolve({ data: payload }),
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
            },
        },
        json: () => Promise.resolve({ message }),
    });
};

describe('useCourseStore Zustand Store', () => {
    const originalConsoleError = console.error;

    beforeAll(() => {
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalConsoleError;
    });

    beforeEach(() => {
        global.fetch.mockReset();
        console.error.mockClear();
        act(() => {
            useCourseStore.setState({
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
            });
        });
    });

    test('verifies initial state is loaded correctly', () => {
        const state = useCourseStore.getState();
        expect(state.user.name).toBe('Student');
        expect(state.courses).toEqual([]);
        expect(state.selectedCourseId).toBeNull();
        expect(state.isLoading).toBe(false);
    });

    test('should fetch and update stats successfully', async () => {
        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({
                totalXP: 320,
                streak: 4,
                levelName: 'Intermediate',
            })
        );

        await act(async () => {
            await useCourseStore.getState().fetchStats();
        });

        const state = useCourseStore.getState();
        expect(state.user.totalXP).toBe(320);
        expect(state.user.streak).toBe(4);
        expect(state.user.levelName).toBe('Intermediate');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should handle stats fetch failure gracefully', async () => {
        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Network Error', 500));

        await act(async () => {
            await useCourseStore.getState().fetchStats();
        });

        expect(console.error).toHaveBeenCalled();
        const state = useCourseStore.getState();
        // Stats remain unchanged
        expect(state.user.totalXP).toBe(0);
    });

    test('should handle select course action correctly', () => {
        act(() => {
            useCourseStore.getState().setSelectedCourse('course_abc');
        });

        const state = useCourseStore.getState();
        expect(state.selectedCourseId).toBe('course_abc');
        expect(state.selectedNode).toBeNull();
    });

    test('should fetch enrolled student courses successfully', async () => {
        // Single request — progress ships embedded in the course list
        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({
                courses: [
                    {
                        _id: 'course_1',
                        title: 'Math 101',
                        enrollmentStatus: 'approved',
                        level: 'Beginner',
                        progress: { percentComplete: 40, totalXP: 100 },
                    },
                ],
            })
        );

        await act(async () => {
            await useCourseStore.getState().fetchCourses();
        });

        const state = useCourseStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.courses.length).toBe(1);
        expect(state.courses[0].title).toBe('Math 101');
        expect(state.courses[0].progress).toBe(40);
        expect(state.courses[0].totalXP).toBe(100);
        expect(state.selectedCourseId).toBe('course_1');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should refresh silently when courses are already cached', async () => {
        act(() => {
            useCourseStore.setState({
                courses: [
                    {
                        _id: 'course_1',
                        id: 'course_1',
                        title: 'Math 101',
                        progress: 0,
                        nodes: [{ _id: 'node_1', title: 'Limits', status: 'current' }],
                    },
                    { _id: 'course_2', id: 'course_2', title: 'Physics', progress: 10, nodes: [] },
                ],
                selectedCourseId: 'course_2',
            });
        });

        let resolveFetch;
        global.fetch.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveFetch = () =>
                        resolve({
                            ok: true,
                            status: 200,
                            headers: { get: () => 'application/json' },
                            json: () =>
                                Promise.resolve({
                                    data: {
                                        courses: [
                                            {
                                                _id: 'course_1',
                                                title: 'Math 101',
                                                enrollmentStatus: 'approved',
                                                progress: { percentComplete: 25, totalXP: 150 },
                                            },
                                            {
                                                _id: 'course_2',
                                                title: 'Physics',
                                                enrollmentStatus: 'approved',
                                                progress: { percentComplete: 10, totalXP: 50 },
                                            },
                                        ],
                                    },
                                }),
                        });
                })
        );

        let fetchPromise;
        act(() => {
            fetchPromise = useCourseStore.getState().fetchCourses();
        });

        // While the refresh is in flight, cached data stays up and no skeleton shows
        expect(useCourseStore.getState().isLoading).toBe(false);
        expect(useCourseStore.getState().courses.length).toBe(2);

        await act(async () => {
            resolveFetch();
            await fetchPromise;
        });

        const state = useCourseStore.getState();
        expect(state.courses[0].progress).toBe(25);
        // User's selection survives the refresh instead of resetting to the first course
        expect(state.selectedCourseId).toBe('course_2');
        // Nodes loaded on demand are not blanked out by the refresh
        expect(state.courses[0].nodes).toEqual([
            { _id: 'node_1', title: 'Limits', status: 'current' },
        ]);
    });

    test('should keep cached courses when a background refresh fails', async () => {
        act(() => {
            useCourseStore.setState({
                courses: [{ _id: 'course_1', id: 'course_1', title: 'Math 101', progress: 40 }],
                selectedCourseId: 'course_1',
            });
        });

        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Network Error', 500));

        await act(async () => {
            await useCourseStore.getState().fetchCourses();
        });

        const state = useCourseStore.getState();
        expect(state.courses.length).toBe(1);
        expect(state.courses[0].progress).toBe(40);
        expect(state.error).toBeNull();
        expect(state.isLoading).toBe(false);
        expect(console.error).toHaveBeenCalled();
    });

    test('should default progress to zero when the course has no embedded progress', async () => {
        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({
                courses: [
                    {
                        _id: 'course_1',
                        title: 'Math 101',
                        enrollmentStatus: 'approved',
                        progress: null,
                    },
                ],
            })
        );

        await act(async () => {
            await useCourseStore.getState().fetchCourses();
        });

        const state = useCourseStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.courses.length).toBe(1);
        expect(state.courses[0].progress).toBe(0);
        expect(state.courses[0].totalXP).toBe(0);
        expect(state.courses[0].color).toBe('bg-studylabs-blue');
    });

    test('should handle overall fetchCourses failure', async () => {
        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Unauthorized', 401));

        await act(async () => {
            await useCourseStore.getState().fetchCourses();
        });

        const state = useCourseStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Unauthorized');
    });

    test('should fetch all courses for instructors successfully', async () => {
        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({
                courses: [
                    {
                        _id: 'course_inst',
                        title: 'CS 101',
                        level: 'Intermediate',
                        color: 'bg-indigo-500',
                    },
                ],
            })
        );

        await act(async () => {
            await useCourseStore.getState().fetchAllCourses();
        });

        const state = useCourseStore.getState();
        expect(state.courses.length).toBe(1);
        expect(state.courses[0].title).toBe('CS 101');
        expect(state.courses[0].color).toBe('bg-indigo-500');
    });

    test('should handle fetchAllCourses failure', async () => {
        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Server Error', 500));

        await act(async () => {
            await useCourseStore.getState().fetchAllCourses();
        });

        const state = useCourseStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('Server Error');
    });

    test('should fetch course nodes successfully when course does not exist in store', async () => {
        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({
                nodes: [{ _id: 'node_1', title: 'Variables', type: 'lesson' }],
                course: { title: 'JS Basics', level: 'Beginner', color: 'bg-green-500' },
            })
        );

        await act(async () => {
            await useCourseStore.getState().fetchCourseNodes('course_js');
        });

        const state = useCourseStore.getState();
        expect(state.courses.length).toBe(1);
        expect(state.courses[0].id).toBe('course_js');
        expect(state.courses[0].nodes.length).toBe(1);
        expect(state.courses[0].nodes[0].title).toBe('Variables');
        expect(state.courses[0].color).toBe('bg-green-500');
    });

    test('should update existing course nodes if course already exists in store', async () => {
        act(() => {
            useCourseStore.setState({
                courses: [{ id: 'course_js', _id: 'course_js', title: 'JS Basics', nodes: [] }],
            });
        });

        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({
                nodes: [{ _id: 'node_updated', title: 'Functions', type: 'lesson' }],
            })
        );

        await act(async () => {
            await useCourseStore.getState().fetchCourseNodes('course_js');
        });

        const state = useCourseStore.getState();
        expect(state.courses.length).toBe(1);
        expect(state.courses[0].nodes.length).toBe(1);
        expect(state.courses[0].nodes[0].title).toBe('Functions');
    });

    test('should handle fetchCourseNodes failure gracefully', async () => {
        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Node Fetch Error', 400));

        let result;
        await act(async () => {
            result = await useCourseStore.getState().fetchCourseNodes('course_js');
        });

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalled();
    });

    test('should manage drawer and select node actions correctly', () => {
        const mockNode = { _id: 'n1', title: 'Node 1' };

        act(() => {
            useCourseStore.getState().setSelectedNode(mockNode);
        });
        expect(useCourseStore.getState().selectedNode).toEqual(mockNode);

        act(() => {
            useCourseStore.getState().closeDrawer();
        });
        expect(useCourseStore.getState().selectedNode).toBeNull();
    });

    test('should complete node and accumulate XP correctly', async () => {
        act(() => {
            useCourseStore.setState({
                courses: [
                    {
                        id: 'c_id',
                        _id: 'c_id',
                        progress: 0,
                        nodes: [
                            { _id: 'n_id', status: 'current' },
                            { _id: 'n_next', status: 'locked' },
                            { _id: 'n_third', status: 'locked' },
                        ],
                    },
                ],
                user: { totalXP: 100 },
            });
        });

        global.fetch.mockImplementationOnce(() =>
            mockFetchResponse({
                percentComplete: 50,
                xpEarned: 200,
                nextNode: { _id: 'n_next', status: 'current' },
            })
        );

        await act(async () => {
            await useCourseStore.getState().completeNode('c_id', 'n_id');
        });

        const state = useCourseStore.getState();
        expect(state.courses[0].progress).toBe(50);
        expect(state.courses[0].nodes[0].status).toBe('completed');
        expect(state.courses[0].nodes[1].status).toBe('current');
        expect(state.user.totalXP).toBe(300);
    });

    test('should handle completeNode failure and throw', async () => {
        global.fetch.mockImplementationOnce(() =>
            mockFetchErrorResponse('Error saving progress', 500)
        );

        await expect(async () => {
            await act(async () => {
                await useCourseStore.getState().completeNode('c_id', 'n_id');
            });
        }).rejects.toThrow('Error saving progress');

        expect(console.error).toHaveBeenCalled();
    });

    test('should delete course successfully', async () => {
        act(() => {
            useCourseStore.setState({
                courses: [
                    { id: 'c1', _id: 'c1' },
                    { id: 'c2', _id: 'c2' },
                ],
                selectedCourseId: 'c1',
            });
        });

        global.fetch.mockImplementationOnce(() => mockFetchResponse({ success: true }));

        await act(async () => {
            await useCourseStore.getState().deleteCourse('c1');
        });

        const state = useCourseStore.getState();
        expect(state.courses.length).toBe(1);
        expect(state.courses[0].id).toBe('c2');
        expect(state.selectedCourseId).toBeNull();
    });

    test('should handle deleteCourse failure and throw', async () => {
        global.fetch.mockImplementationOnce(() => mockFetchErrorResponse('Delete Error', 400));

        await expect(async () => {
            await act(async () => {
                await useCourseStore.getState().deleteCourse('c1');
            });
        }).rejects.toThrow('Delete Error');

        expect(console.error).toHaveBeenCalled();
    });
});
