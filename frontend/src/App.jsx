import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Spinner from './components/common/Spinner';
import StudentLayout from './components/layout/StudentLayout';
import InstructorLayout from './components/layout/InstructorLayout';
import useAuthStore from './store/authStore';
import useSettingsStore from './store/settingsStore';
import useGamificationStore from './store/gamificationStore';

// Route-level page screens — loaded when their route is first visited, and
// prefetched in the background once the user's role is known (RoutePrefetcher).
const loadLoginPage = () => import('./pages/LoginPage');
const loadAuthCallback = () => import('./pages/AuthCallback');
const loadRoleSelectPage = () => import('./pages/RoleSelectPage');
const loadDashboard = () => import('./pages/Dashboard');
const loadMyCourses = () => import('./pages/MyCourses');
const loadMyEnrollments = () => import('./pages/MyEnrollments');
const loadCourseMap = () => import('./pages/CourseMap');
const loadLessonQuiz = () => import('./pages/LessonQuiz');
const loadStudentProfile = () => import('./pages/StudentProfile');
const loadStudyShop = () => import('./pages/StudyShop');
const loadLeaderboardPage = () => import('./pages/LeaderboardPage');
const loadInstructorDashboard = () => import('./pages/InstructorDashboard');
const loadStudentStatusOverview = () => import('./pages/StudentStatusOverview');
const loadCourseWizard = () => import('./pages/CourseWizard');
const loadManagedCourses = () => import('./pages/ManagedCourses');
const loadClassRoster = () => import('./pages/ClassRoster');
const loadInstructorStats = () => import('./pages/InstructorStats');
const loadAdminPage = () => import('./pages/AdminPage');

const LoginPage = lazy(loadLoginPage);
const AuthCallback = lazy(loadAuthCallback);
const RoleSelectPage = lazy(loadRoleSelectPage);
const Dashboard = lazy(loadDashboard);
const MyCourses = lazy(loadMyCourses);
const MyEnrollments = lazy(loadMyEnrollments);
const CourseMap = lazy(loadCourseMap);
const LessonQuiz = lazy(loadLessonQuiz);
const StudentProfile = lazy(loadStudentProfile);
const StudyShop = lazy(loadStudyShop);
const LeaderboardPage = lazy(loadLeaderboardPage);
const InstructorDashboard = lazy(loadInstructorDashboard);
const StudentStatusOverview = lazy(loadStudentStatusOverview);
const CourseWizard = lazy(loadCourseWizard);
const ManagedCourses = lazy(loadManagedCourses);
const ClassRoster = lazy(loadClassRoster);
const InstructorStats = lazy(loadInstructorStats);
const AdminPage = lazy(loadAdminPage);

const STUDENT_PAGE_LOADERS = [
    loadDashboard,
    loadMyCourses,
    loadMyEnrollments,
    loadCourseMap,
    loadLessonQuiz,
    loadStudentProfile,
    loadStudyShop,
    loadLeaderboardPage,
];

const INSTRUCTOR_PAGE_LOADERS = [
    loadInstructorDashboard,
    loadStudentStatusOverview,
    loadCourseWizard,
    loadManagedCourses,
    loadClassRoster,
    loadCourseMap,
    loadLessonQuiz,
    loadInstructorStats,
];

// Warm the page chunks for the user's role while the browser is idle, so the
// first visit to each page doesn't wait on a network fetch.
const RoutePrefetcher = () => {
    const { isAuthenticated, role, user } = useAuthStore();

    React.useEffect(() => {
        if (!isAuthenticated) return undefined;

        const userRoles = user?.roles?.length > 0 ? user.roles : role ? [role] : [];
        const loaders = [
            ...(role === 'student' ? STUDENT_PAGE_LOADERS : []),
            ...(role === 'instructor' ? INSTRUCTOR_PAGE_LOADERS : []),
            ...(userRoles.includes('admin') ? [loadAdminPage] : []),
        ];
        if (loaders.length === 0) return undefined;

        // Safari has no requestIdleCallback; fall back to a delayed timeout.
        const schedule = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 2000));
        const cancel = window.cancelIdleCallback ?? clearTimeout;
        const handle = schedule(() => {
            loaders.forEach((load) => load().catch(() => {}));
        });
        return () => cancel(handle);
    }, [isAuthenticated, role, user]);

    return null;
};

const ThemeWrapper = ({ children }) => {
    const { theme } = useSettingsStore();
    const { activeTheme } = useGamificationStore();

    React.useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'theme-arcade', 'theme-space', 'theme-cyberpunk');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(theme);
        }

        if (activeTheme && activeTheme !== 'default') {
            root.classList.add(`theme-${activeTheme}`);
        }
    }, [theme, activeTheme]);

    return children;
};

const FullScreenLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Spinner />
    </div>
);

// Shown inside the persistent layout while a lazy page chunk loads.
const PageLoader = () => (
    <div className="flex-1 flex items-center justify-center py-24">
        <Spinner />
    </div>
);

// Layout routes: the sidebar/header shell mounts once and persists across page
// navigations — only the <Outlet/> content swaps.
const StudentShell = () => (
    <ProtectedRoute allowedRole="student">
        <StudentLayout>
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
        </StudentLayout>
    </ProtectedRoute>
);

const InstructorShell = () => (
    <ProtectedRoute allowedRole="instructor">
        <InstructorLayout>
            <Suspense fallback={<PageLoader />}>
                <Outlet />
            </Suspense>
        </InstructorLayout>
    </ProtectedRoute>
);

// The student lesson route is open to any authenticated role, so the layout
// follows the user's role rather than the route tree.
const LessonShell = () => {
    const { role } = useAuthStore();
    const Layout = role === 'instructor' ? InstructorLayout : StudentLayout;
    return (
        <ProtectedRoute>
            <Layout>
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </Layout>
        </ProtectedRoute>
    );
};

const AuthWrapper = ({ children }) => {
    const { initialize, isLoading } = useAuthStore();

    React.useEffect(() => {
        initialize();
    }, [initialize]);

    if (isLoading) {
        return <FullScreenLoader />;
    }

    return children;
};

function App() {
    return (
        <BrowserRouter>
            <ThemeWrapper>
                <AuthWrapper>
                    <RoutePrefetcher />
                    <Suspense fallback={<FullScreenLoader />}>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route
                                path="/role-select"
                                element={
                                    <ProtectedRoute>
                                        <RoleSelectPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Student Routes — share one persistent StudentLayout */}
                            <Route element={<StudentShell />}>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/my-courses" element={<MyCourses />} />
                                <Route path="/enrollments" element={<MyEnrollments />} />
                                <Route path="/course/:id" element={<CourseMap />} />
                                <Route path="/profile" element={<StudentProfile />} />
                                <Route path="/shop" element={<StudyShop />} />
                                <Route path="/leaderboard" element={<LeaderboardPage />} />
                            </Route>

                            {/* Lesson route — any authenticated role, layout picked by role */}
                            <Route element={<LessonShell />}>
                                <Route
                                    path="/course/:courseId/lesson/:id"
                                    element={<LessonQuiz />}
                                />
                            </Route>

                            {/* Instructor Routes — share one persistent InstructorLayout */}
                            <Route element={<InstructorShell />}>
                                <Route path="/instructor" element={<InstructorDashboard />} />
                                <Route
                                    path="/instructor/status"
                                    element={<StudentStatusOverview />}
                                />
                                <Route path="/instructor/create" element={<CourseWizard />} />
                                <Route path="/instructor/managed" element={<ManagedCourses />} />
                                <Route path="/instructor/class" element={<ClassRoster />} />
                                <Route path="/instructor/course/:id" element={<CourseMap />} />
                                <Route
                                    path="/instructor/course/:courseId/lesson/:id"
                                    element={<LessonQuiz />}
                                />
                                <Route path="/instructor/stats" element={<InstructorStats />} />
                            </Route>

                            {/* Admin routes — nested so /admin/* all go to AdminPage's internal router */}
                            <Route
                                path="/admin/*"
                                element={
                                    <ProtectedRoute allowedRole="admin">
                                        <AdminPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Catch all */}
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </Suspense>
                </AuthWrapper>
            </ThemeWrapper>
        </BrowserRouter>
    );
}

export default App;
