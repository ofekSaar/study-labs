import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import LessonQuiz from './pages/LessonQuiz';
import CourseMap from './pages/CourseMap';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentStatusOverview from './pages/StudentStatusOverview';
import CourseWizard from './pages/CourseWizard';
import ManagedCourses from './pages/ManagedCourses';
import MyEnrollments from './pages/MyEnrollments';
import MyCourses from './pages/MyCourses';
import EnrollmentRequests from './pages/EnrollmentRequests';
import AuthCallback from './pages/AuthCallback';
import RoleSelectPage from './pages/RoleSelectPage';
import useAuthStore from './store/authStore';
import useSettingsStore from './store/settingsStore';
import StudentProfile from './pages/StudentProfile';

const ThemeWrapper = ({ children }) => {
  const { theme } = useSettingsStore();

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

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
      </AuthWrapper>
      </ThemeWrapper>
    </BrowserRouter>
  )
}

export default App;
