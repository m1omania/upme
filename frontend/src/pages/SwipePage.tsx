import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { vacanciesApi } from '../services/api';
import SwipeCard from '../components/SwipeCard';
import VacancyDetailModal from '../components/VacancyDetailModal';
import EmptyState from '../components/EmptyState';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { X, Heart } from 'lucide-react';

export default function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allVacancies, setAllVacancies] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedVacancyId, setSelectedVacancyId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animateLeft, setAnimateLeft] = useState(false);
  const [animateRight, setAnimateRight] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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

  // Восстанавливаем индекс карточки при возврате со страницы отклика
  useEffect(() => {
    const state = location.state as { cardIndex?: number } | null;
    if (state?.cardIndex !== undefined && allVacancies && allVacancies.length > 0) {
      const savedIndex = state.cardIndex;
      if (savedIndex >= 0 && savedIndex < allVacancies.length) {
        setCurrentIndex(savedIndex);
        // Очищаем state, чтобы при следующей загрузке не восстанавливать индекс
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, allVacancies]);

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
  
  // Загружаем вакансии по страницам
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vacancies', currentPage],
    queryFn: async () => {
      if (!effectiveToken) {
        throw new Error('No token available');
      }
      const response = await vacanciesApi.getRelevant(currentPage);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to load vacancies');
    },
    enabled: !!effectiveToken && effectiveAuth, // Запрос только если есть токен
    retry: false, // Не повторяем запрос при ошибке, чтобы не удалять токен
  });

  // Обновляем allVacancies когда приходят новые данные
  React.useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      console.log('SwipePage - Received vacancies:', data.length);
      setAllVacancies(prev => {
        // Если это первая страница (currentPage === 0), заменяем все вакансии
        if (currentPage === 0) {
          console.log('SwipePage - First page, replacing all vacancies');
          return data;
        }
        // Иначе добавляем новые (без дубликатов)
        const existingIds = new Set(prev.map(v => v.vacancy.id));
        const uniqueNew = data.filter((v: any) => !existingIds.has(v.vacancy.id));
        const updated = [...prev, ...uniqueNew];
        console.log('SwipePage - Updated allVacancies:', updated.length, 'total (added', uniqueNew.length, 'new)');
        return updated;
      });
    }
  }, [data, currentPage]);

  const currentVacancy = allVacancies[currentIndex];
  
  console.log('SwipePage - Current state:', {
    allVacanciesLength: allVacancies.length,
    currentIndex,
    hasCurrentVacancy: !!currentVacancy,
    isLoading,
    hasData: !!data,
    dataLength: Array.isArray(data) ? data.length : 0,
    currentPage,
  });

  const handleSwipeLeft = () => {
    // Сбрасываем анимацию
    setAnimateLeft(false);
    if (currentIndex < allVacancies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Загружаем следующую страницу
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      // После загрузки индекс автоматически обновится через onSuccess
    }
  };

  const handleSwipeRight = () => {
    // Сбрасываем анимацию
    setAnimateRight(false);
    if (currentVacancy) {
      navigate(`/swipe/${currentVacancy.vacancy.id}/letter`, {
        state: { cardIndex: currentIndex }
      });
    }
  };

  const handleButtonSwipeLeft = () => {
    setAnimateLeft(true);
  };

  const handleButtonSwipeRight = () => {
    setAnimateRight(true);
  };

  const handleCardClick = () => {
    if (currentVacancy) {
      setSelectedVacancyId(currentVacancy.vacancy.id);
      setIsModalOpen(true);
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

  if (allVacancies.length === 0 && !isLoading && !data) {
    return (
      <EmptyState 
        message="Нет новых вакансий. Попробуйте позже или обновите фильтры в профиле."
        onRetry={() => {
          setCurrentPage(0);
          setAllVacancies([]);
          setCurrentIndex(0);
          refetch();
        }}
      />
    );
  }

  // Если данные загружены, но вакансий нет в allVacancies, показываем загрузку
  if (isLoading || (data && allVacancies.length === 0)) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Container>
    );
  }

  if (!currentVacancy && allVacancies.length > 0) {
    // Если индекс выходит за пределы, сбрасываем на 0
    if (currentIndex >= allVacancies.length) {
      setCurrentIndex(0);
      return null; // Компонент перерендерится
    }
  }

  if (!currentVacancy) {
    return (
      <EmptyState 
        message="Вакансия не найдена. Попробуйте обновить страницу."
        onRetry={() => {
          setCurrentPage(0);
          setAllVacancies([]);
          setCurrentIndex(0);
          refetch();
        }}
      />
    );
  }

  return (
    <>
      <Container maxWidth="sm">
        <div className="pt-0 md:pt-8 pb-8 flex flex-col items-center gap-4">
          <SwipeCard
            key={currentVacancy.vacancy.id}
            vacancy={currentVacancy.vacancy}
            relevance={currentVacancy.relevance_score}
            reasons={currentVacancy.reasons}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onCardClick={handleCardClick}
            animateLeft={animateLeft}
            animateRight={animateRight}
          />

          <div className="flex gap-4 mt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handleButtonSwipeLeft}
              className="gap-2"
            >
              <X className="h-5 w-5" />
              Пропустить
            </Button>
            <Button
              size="lg"
              onClick={handleButtonSwipeRight}
              className="gap-2"
            >
              <Heart className="h-5 w-5" />
              Отклик
            </Button>
          </div>
        </div>
      </Container>

      <VacancyDetailModal
        vacancyId={selectedVacancyId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialRelevance={currentVacancy ? {
          relevance_score: currentVacancy.relevance_score,
          reasons: currentVacancy.reasons,
        } : undefined}
        onSkip={handleSwipeLeft}
        onApply={handleSwipeRight}
      />
    </>
  );
}
