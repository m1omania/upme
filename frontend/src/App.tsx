import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import LandingPage from './pages/LandingPage';
import SwipePage from './pages/SwipePage';
import CoverLetterPage from './pages/CoverLetterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AuthErrorPage from './pages/AuthErrorPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';

function App() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const token = useUserStore((state) => state.token);
  const localStorageToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Отладка
  console.log('App render - isAuthenticated:', isAuthenticated, 'token:', token ? 'present' : 'missing', 'localStorage:', localStorageToken ? 'present' : 'missing');
  
  // Синхронизируем store с localStorage при монтировании
  React.useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !token) {
      console.log('App - Found token in localStorage, restoring to store');
      useUserStore.getState().setToken(storedToken);
    }
  }, []);

  return (
    <BrowserRouter>
      {isAuthenticated && <Navigation />}
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/swipe" replace /> : <LandingPage />}
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/error" element={<AuthErrorPage />} />
        <Route
          path="/swipe"
          element={
            <ProtectedRoute>
              <SwipePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/swipe/:vacancyId/letter"
          element={
            <ProtectedRoute>
              <CoverLetterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
