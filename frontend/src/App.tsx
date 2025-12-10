import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import LandingPage from './pages/LandingPage';
import SwipePage from './pages/SwipePage';
import CoverLetterPage from './pages/CoverLetterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import BlogAdminPage from './pages/BlogAdminPage';
import PricingPage from './pages/PricingPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AuthErrorPage from './pages/AuthErrorPage';
import TokenCopyPage from './pages/TokenCopyPage';
import VacancyDetailPage from './pages/VacancyDetailPage';
import CreditsPage from './pages/CreditsPage';
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
      <div className="pb-16 md:pb-0 overflow-visible">
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/swipe" replace /> : <LandingPage />}
          />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/error" element={<AuthErrorPage />} />
          <Route path="/token-copy" element={<TokenCopyPage />} />
          <Route
            path="/swipe"
            element={
              <ProtectedRoute>
                <SwipePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/swipe/:vacancyId"
            element={
              <ProtectedRoute>
                <VacancyDetailPage />
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
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <CreditsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route
            path="/mio"
            element={<BlogAdminPage />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
