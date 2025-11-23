import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { Container } from '@/components/ui/container';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setToken = useUserStore((state) => state.setToken);
  const setUser = useUserStore((state) => state.setUser);

  // Логируем рендер компонента
  console.log('AuthCallbackPage - Component rendered');
  console.log('AuthCallbackPage - Current URL:', window.location.href);
  console.log('AuthCallbackPage - Search params:', Object.fromEntries(searchParams.entries()));

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    console.log('=== AuthCallback START ===');
    console.log('AuthCallback - Full URL:', window.location.href);
    console.log('AuthCallback - token from URL:', token ? `present (${token.substring(0, 20)}...)` : 'missing', 'error:', error);
    console.log('AuthCallback - localStorage token before:', localStorage.getItem('token') ? 'present' : 'missing');

    if (error) {
      console.error('Auth error:', error);
      alert('Ошибка авторизации: ' + error);
      navigate('/');
      return;
    }

    if (token) {
      console.log('Setting token and user...');
      // Сначала устанавливаем токен
      setToken(token);
      
      // Проверяем сразу после установки
      const checkToken = localStorage.getItem('token');
      console.log('AuthCallback - localStorage token after setToken:', checkToken ? `present (${checkToken.substring(0, 20)}...)` : 'missing');
      
      if (!checkToken) {
        console.error('ERROR: Token was not saved to localStorage!');
        // Попробуем сохранить напрямую
        localStorage.setItem('token', token);
        console.log('AuthCallback - Manually saved token to localStorage');
      }
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        setUser({ id: payload.userId, email: payload.email || 'user@example.com' });
        
        // Проверяем store
        const storeToken = useUserStore.getState().token;
        const storeAuth = useUserStore.getState().isAuthenticated;
        console.log('AuthCallback - Store state after setUser:', { 
          token: storeToken ? 'present' : 'missing', 
          isAuthenticated: storeAuth 
        });
        
        // Проверяем, что токен действительно сохранен
        const savedToken = localStorage.getItem('token');
        console.log('AuthCallback - Final check, savedToken:', savedToken ? `present (${savedToken.substring(0, 20)}...)` : 'missing');
        
        // Увеличиваем задержку, чтобы store точно успел обновиться
        setTimeout(() => {
          const finalCheck = localStorage.getItem('token');
          const finalStoreAuth = useUserStore.getState().isAuthenticated;
          console.log('AuthCallback - Before navigation check:', { 
            localStorage: finalCheck ? 'present' : 'missing',
            storeAuth: finalStoreAuth 
          });
          
          // Если токен все еще не сохранен, сохраняем его еще раз
          if (!finalCheck) {
            console.error('CRITICAL: Token still not in localStorage, saving again');
            localStorage.setItem('token', token);
            useUserStore.getState().setToken(token);
          }
          
          // Устанавливаем флаг, что мы только что авторизовались
          sessionStorage.setItem('just_authenticated', 'true');
          // Удаляем флаг через 10 секунд
          setTimeout(() => {
            sessionStorage.removeItem('just_authenticated');
          }, 10000);
          
          console.log('AuthCallback - Navigating to /swipe');
          navigate('/swipe', { replace: true });
        }, 1000);
      } catch (error) {
        console.error('Error parsing token:', error);
        setUser({ id: 0, email: 'user@example.com' });
        setTimeout(() => {
          navigate('/swipe', { replace: true });
        }, 500);
      }
    } else {
      console.log('No token found, redirecting to home...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  }, [searchParams, navigate, setToken, setUser]);

  return (
    <Container>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Авторизация...</p>
      </div>
    </Container>
  );
}
