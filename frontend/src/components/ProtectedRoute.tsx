import { Navigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const [isChecking, setIsChecking] = useState(true);

  // Проверяем localStorage при монтировании и восстанавливаем токен
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    console.log('ProtectedRoute - useEffect check:', { 
      storedToken: storedToken ? 'present' : 'missing',
      token: token ? 'present' : 'missing',
      isAuthenticated 
    });
    
    if (storedToken && !token) {
      console.log('ProtectedRoute - Found token in localStorage, restoring to store');
      setToken(storedToken);
      // Даем время store обновиться
      setTimeout(() => {
        setIsChecking(false);
      }, 100);
    } else {
      setIsChecking(false);
    }
  }, [token, setToken, isAuthenticated]);

  // Проверяем и токен, и isAuthenticated, и localStorage
  const localStorageToken = localStorage.getItem('token');
  
  // Пока проверяем, показываем загрузку
  if (isChecking) {
    console.log('ProtectedRoute - Still checking token...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const shouldRedirect = !isAuthenticated && !token && !localStorageToken;
  
  console.log('ProtectedRoute - render check:', { 
    isAuthenticated, 
    token: token ? 'present' : 'missing',
    localStorageToken: localStorageToken ? 'present' : 'missing',
    shouldRedirect 
  });

  if (shouldRedirect) {
    console.log('ProtectedRoute - Not authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

