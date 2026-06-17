import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const StudentStatusOverview = lazy(() => import('./pages/StudentStatusOverview'));
const CourseWizard = lazy(() => import('./pages/CourseWizard'));
const EnrollmentRequests = lazy(() => import('./pages/EnrollmentRequests'));
const ManagedCourses = lazy(() => import('./pages/ManagedCourses'));

const ThemeWrapper = ({ children }) => {
  const { theme } = useSettingsStore();
  const { activeTheme } = useGamificationStore();

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'theme-arcade', 'theme-space', 'theme-cyberpunk');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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

const AuthWrapper = ({ children }) => {
  const { initialize, isLoading } = useAuthStore();

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeWrapper>
        <AuthWrapper>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
              <div className="animate-spin w-8 h-8 border-4 border-studylabs-blue border-t-transparent rounded-full"></div>
            </div>
          }>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/role-select" element={<ProtectedRoute><RoleSelectPage /></ProtectedRoute>} />
          
          {/* Student Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedRole="student">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-courses" 
          element={
            <ProtectedRoute allowedRole="student">
              <MyCourses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/enrollments" 
          element={
            <ProtectedRoute allowedRole="student">
              <MyEnrollments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/course/:id" 
          element={
            <ProtectedRoute allowedRole="student">
              <CourseMap />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/course/:courseId/lesson/:id" 
          element={
            <ProtectedRoute>
              <LessonQuiz />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRole="student">
              <StudentProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/shop" 
          element={
            <ProtectedRoute allowedRole="student">
              <StudyShop />
            </ProtectedRoute>
          } 
        />

        {/* Instructor Routes */}
        <Route 
          path="/instructor" 
          element={
            <ProtectedRoute allowedRole="instructor">
              <InstructorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/instructor/status" 
          element={
            <ProtectedRoute allowedRole="instructor">
              <StudentStatusOverview />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/instructor/create" 
          element={
            <ProtectedRoute allowedRole="instructor">
              <CourseWizard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/instructor/enrollments" 
          element={
            <ProtectedRoute allowedRole="instructor">
              <EnrollmentRequests />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/instructor/managed" 
          element={
            <ProtectedRoute allowedRole="instructor">
              <ManagedCourses />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/instructor/course/:id" 
          element={
            <ProtectedRoute allowedRole="instructor">
              <CourseMap />
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
  )
}

export default App;
