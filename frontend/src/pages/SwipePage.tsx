import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { vacanciesApi } from '../services/api';
import SwipeCard from '../components/SwipeCard';
import EmptyState from '../components/EmptyState';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { X, Heart } from 'lucide-react';

export default function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);

  // Проверяем localStorage при монтировании
  React.useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !token) {
      console.log('SwipePage - Found token in localStorage, restoring to store');
      setToken(storedToken);
    }
  }, [token, setToken]);

  console.log('SwipePage render - isAuthenticated:', isAuthenticated, 'token:', token ? 'present' : 'missing');

  // Проверяем токен из localStorage тоже
  const localStorageToken = localStorage.getItem('token');
  const effectiveToken = token || localStorageToken;
  const effectiveAuth = isAuthenticated || !!localStorageToken;
  
  console.log('SwipePage - Query check:', { 
    token: token ? 'present' : 'missing',
    localStorageToken: localStorageToken ? 'present' : 'missing',
    effectiveToken: effectiveToken ? 'present' : 'missing',
    isAuthenticated,
    effectiveAuth
  });
  
  // Не делаем запрос, если нет токена
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vacancies', currentIndex],
    queryFn: async () => {
      if (!effectiveToken) {
        throw new Error('No token available');
      }
      const response = await vacanciesApi.getRelevant(Math.floor(currentIndex / 20));
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to load vacancies');
    },
    enabled: !!effectiveToken && effectiveAuth, // Запрос только если есть токен
    retry: false, // Не повторяем запрос при ошибке, чтобы не удалять токен
  });

  const vacancies = (data as any) || [];
  const currentVacancy = vacancies[currentIndex % vacancies.length];

  const handleSwipeLeft = () => {
    if (currentIndex < vacancies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      refetch();
    }
  };

  const handleSwipeRight = () => {
    if (currentVacancy) {
      navigate(`/swipe/${currentVacancy.vacancy.id}/letter`);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <EmptyState 
        message={`Ошибка загрузки вакансий: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`}
        onRetry={() => refetch()}
      />
    );
  }

  if (vacancies.length === 0 && !isLoading) {
    return (
      <EmptyState 
        message="Нет новых вакансий. Попробуйте позже или обновите фильтры в профиле."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <Container maxWidth="sm">
      <div className="py-8 flex flex-col items-center gap-4">
        {currentVacancy && (
          <SwipeCard
            key={currentVacancy.vacancy.id}
            vacancy={currentVacancy.vacancy}
            relevance={currentVacancy.relevance_score}
            reasons={currentVacancy.reasons}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        )}

        <div className="flex gap-4 mt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSwipeLeft}
            className="gap-2"
          >
            <X className="h-5 w-5" />
            Пропустить
          </Button>
          <Button
            size="lg"
            onClick={handleSwipeRight}
            className="gap-2"
          >
            <Heart className="h-5 w-5" />
            Отклик
          </Button>
        </div>
      </div>
    </Container>
  );
}
