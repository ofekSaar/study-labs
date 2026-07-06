import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Spinner from './components/common/Spinner';
import StudentLayout from './components/layout/StudentLayout';
import InstructorLayout from './components/layout/InstructorLayout';
import useAuthStore from './store/authStore';
import useSettingsStore from './store/settingsStore';
import useGamificationStore from './store/gamificationStore';

// Route-level page screens — loaded only when their route is first visited.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const RoleSelectPage = lazy(() => import('./pages/RoleSelectPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const MyEnrollments = lazy(() => import('./pages/MyEnrollments'));
const CourseMap = lazy(() => import('./pages/CourseMap'));
const LessonQuiz = lazy(() => import('./pages/LessonQuiz'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const StudyShop = lazy(() => import('./pages/StudyShop'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const StudentStatusOverview = lazy(() => import('./pages/StudentStatusOverview'));
const CourseWizard = lazy(() => import('./pages/CourseWizard'));
const ManagedCourses = lazy(() => import('./pages/ManagedCourses'));
const ClassRoster = lazy(() => import('./pages/ClassRoster'));
const InstructorStats = lazy(() => import('./pages/InstructorStats'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

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
