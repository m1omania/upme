import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import { vacanciesApi } from '../services/api';
import VanillaSwipeCard from '../components/VanillaSwipeCard';
import EmptyState from '../components/EmptyState';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { X, Heart, RotateCcw, RefreshCw, Settings } from 'lucide-react';
import FiltersDialog from '../components/FiltersDialog';

export default function SwipePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allVacancies, setAllVacancies] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isUndoing, setIsUndoing] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [lastPageLength, setLastPageLength] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  // Восстанавливаем индекс карточки при возврате со страницы деталей или отклика
  useEffect(() => {
    const state = location.state as { cardIndex?: number; skipVacancyId?: number } | null;
    if (state?.cardIndex !== undefined && allVacancies && allVacancies.length > 0) {
      const savedIndex = state.cardIndex;
      if (savedIndex >= 0 && savedIndex < allVacancies.length) {
        const currentVac = allVacancies[savedIndex];
        setCurrentIndex(savedIndex);
        // Если нужно пропустить вакансию (skipVacancyId), увеличиваем индекс
        if (state?.skipVacancyId && currentVac && currentVac.vacancy.id === state.skipVacancyId) {
          if (savedIndex < allVacancies.length - 1) {
            setCurrentIndex(savedIndex + 1);
          } else if (hasMorePages) {
            // Загружаем следующую страницу
            setCurrentPage(currentPage + 1);
          } else {
            // Больше нет страниц - увеличиваем индекс чтобы показать экран окончания
            setCurrentIndex(savedIndex + 1);
          }
        }
        // Очищаем state, чтобы при следующей загрузке не восстанавливать индекс
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, allVacancies, hasMorePages, currentPage]);

  // Проверяем токен из localStorage тоже
  const localStorageToken = localStorage.getItem('token');
  const effectiveToken = token || localStorageToken;
  const effectiveAuth = isAuthenticated || !!localStorageToken;
  
  console.log('📱 SwipePage Debug:', { 
    hostname: window.location.hostname,
    fullURL: window.location.href,
    token: token ? 'present' : 'missing',
    localStorageToken: localStorageToken ? 'present' : 'missing',
    effectiveToken: effectiveToken ? 'present' : 'missing',
    isAuthenticated,
    effectiveAuth,
    queryEnabled: !!effectiveToken && effectiveAuth,
  });
  
  // Загружаем вакансии по страницам
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vacancies', currentPage],
    queryFn: async () => {
      console.log('🔄 SwipePage - Fetching vacancies, page:', currentPage);
      if (!effectiveToken) {
        console.error('❌ SwipePage - No token available!');
        throw new Error('No token available');
      }
      try {
        const response = await vacanciesApi.getRelevant(currentPage);
        console.log('✅ SwipePage - Vacancies response:', {
          success: response.success,
          dataLength: response.data?.length || 0,
        });
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to load vacancies');
      } catch (err: any) {
        console.error('❌ SwipePage - Error fetching vacancies:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        throw err;
      }
    },
    enabled: !!effectiveToken && effectiveAuth, // Запрос только если есть токен
    retry: false, // Не повторяем запрос при ошибке, чтобы не удалять токен
  });

  // Обновляем allVacancies когда приходят новые данные
  React.useEffect(() => {
    if (data && Array.isArray(data)) {
      console.log('SwipePage - Received vacancies:', data.length, 'page:', currentPage);
      
      // Если пустой массив - больше нет страниц
      if (data.length === 0) {
        console.log('SwipePage - No more pages (empty data)');
        setHasMorePages(false);
        return;
      }
      
      if (data.length > 0) {
        setAllVacancies(prev => {
          // Если это первая страница (currentPage === 0), заменяем все вакансии
          if (currentPage === 0) {
            console.log('SwipePage - First page, replacing all vacancies');
            setHasMorePages(true); // Сбрасываем флаг для новой загрузки
            return data;
          }
          // Иначе добавляем новые (без дубликатов)
          const existingIds = new Set(prev.map(v => v.vacancy.id));
          const uniqueNew = data.filter((v: any) => !existingIds.has(v.vacancy.id));
          const updated = [...prev, ...uniqueNew];
          console.log('SwipePage - Updated allVacancies:', updated.length, 'total (added', uniqueNew.length, 'new)');
          
          // Если не добавили новых уникальных - значит больше нет страниц
          if (uniqueNew.length === 0) {
            console.log('SwipePage - No new unique vacancies, no more pages');
            setHasMorePages(false);
            // Если индекс уже вышел за пределы - сразу показываем экран окончания
            if (currentIndex >= prev.length) {
              console.log('SwipePage - Index already out of bounds, showing finish screen');
            }
          } else if (data.length < 20) {
            // Если пришло меньше 20 (обычно страницы по 20) - вероятно последняя страница
            console.log('SwipePage - Less than 20 items, likely last page');
            setHasMorePages(false);
          } else if (uniqueNew.length < data.length) {
            // Если добавили меньше чем пришло - возможно дубликаты, но проверим
            console.log('SwipePage - Some duplicates found, but continuing');
          }
          
          return updated;
        });
      }
    } else if (!isLoading && currentPage > 0 && !data) {
      // Если нет данных и это не первая страница - больше нет страниц
      console.log('SwipePage - No data on page > 0, no more pages');
      setHasMorePages(false);
    }
  }, [data, currentPage, isLoading]);

  // Отслеживаем когда все вакансии закончились и принудительно показываем экран
  useEffect(() => {
    if (
      !isLoading &&
      allVacancies.length > 0 &&
      currentIndex >= allVacancies.length &&
      !hasMorePages
    ) {
      console.log('SwipePage - All vacancies finished detected, should show finish screen');
      // Принудительно устанавливаем флаг чтобы экран показался
      // Это триггерит ре-рендер с правильным условием
    }
  }, [isLoading, allVacancies.length, currentIndex, hasMorePages]);

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
    if (currentIndex < allVacancies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Если это последняя карточка
      if (hasMorePages) {
        // Загружаем следующую страницу
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
      } else {
        // Больше нет страниц - увеличиваем индекс чтобы показать экран окончания
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const handleSwipeRight = () => {
    if (currentVacancy) {
      navigate(`/swipe/${currentVacancy.vacancy.id}/letter`, {
        state: { cardIndex: currentIndex }
      });
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setIsUndoing(true);
      setCurrentIndex(currentIndex - 1);
      // Сбрасываем флаг после анимации
      setTimeout(() => {
        setIsUndoing(false);
      }, 400);
    }
  };

  const canUndo = currentIndex > 0;

  const handleReload = () => {
    // Сбрасываем все состояние и перезагружаем с первой страницы
    setCurrentIndex(0);
    setCurrentPage(0);
    setAllVacancies([]);
    setHasMorePages(true);
    refetch();
  };

  const handleCardClick = () => {
    if (currentVacancy) {
      // Переходим на страницу деталей вакансии, сохраняя текущий индекс для возврата
      navigate(`/swipe/${currentVacancy.vacancy.id}`, { state: { cardIndex: currentIndex } });
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

  // Показываем сообщение если нет токена
  if (!effectiveToken && !isLoading) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="text-yellow-500 text-lg font-semibold">Токен не найден</div>
            <div className="text-sm text-muted-foreground">
              Авторизуйтесь или импортируйте токен через страницу /token-copy
            </div>
            <Button onClick={() => navigate('/token-copy')} variant="outline">
              Импортировать токен
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // Проверяем что все вакансии закончились (проверяем РАНЬШЕ ВСЕГО)
  const allVacanciesFinished = 
    !isLoading && 
    allVacancies.length > 0 && 
    currentIndex >= allVacancies.length && 
    (!hasMorePages || (data && Array.isArray(data) && data.length === 0));

  console.log('SwipePage - Check finished (EARLY):', {
    isLoading,
    allVacanciesLength: allVacancies.length,
    currentIndex,
    hasMorePages,
    allVacanciesFinished,
    dataLength: data?.length,
  });

  if (allVacanciesFinished) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-3">
              <div className="text-2xl font-bold text-foreground">
                На сегодня больше ничего нет
              </div>
              <div className="text-muted-foreground">
                Зайдите позже или посмотрите еще раз
              </div>
            </div>
            
            <Button
              onClick={handleReload}
              size="lg"
              className="gap-2 w-full"
            >
              <RefreshCw className="h-5 w-5" />
              Загрузить список заново
            </Button>
            
            <p className="text-xs text-muted-foreground">
              Будут показаны все вакансии кроме тех, на которые уже был отклик
            </p>
          </div>
        </div>
      </Container>
    );
  }

  // Если данные загружены, но вакансий нет в allVacancies, показываем загрузку
  if (isLoading || (data && allVacancies.length === 0)) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="text-sm text-muted-foreground">
              Загрузка вакансий...
              <br />
              <span className="text-xs font-mono">
                {window.location.hostname}
              </span>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (!currentVacancy && allVacancies.length > 0) {
    // Если индекс выходит за пределы, но еще есть страницы - загружаем следующую
    if (currentIndex >= allVacancies.length && hasMorePages && !isLoading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      return (
        <Container>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <div className="text-sm text-muted-foreground">
                Загрузка следующих вакансий...
              </div>
            </div>
          </div>
        </Container>
      );
    }
  }

  if (!currentVacancy && !allVacanciesFinished) {
    // Показываем EmptyState только если это не экран окончания
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

  // Стек карточек (показываем до 3 карточек)
  const maxCards = Math.min(3, allVacancies.length - currentIndex);
  const visibleCards = allVacancies.slice(currentIndex, currentIndex + maxCards);

  return (
    <>
      <div className="w-full overflow-visible" style={{ overflow: 'visible', overflowY: 'visible', overflowX: 'visible' }}>
        <div className="flex flex-col items-center pt-8 md:pt-6 pb-20 md:pb-4 overflow-visible px-4" style={{ overflow: 'visible', overflowY: 'visible', overflowX: 'visible' }}>
          {/* Контейнер стека карточек - без ограничений по ширине, чтобы карточки не обрезались */}
          <div className="relative w-full max-w-md mx-auto h-[calc(100dvh-240px)] min-h-[450px] max-h-[650px] mb-8 md:mb-6 overflow-visible" style={{ padding: '0 2rem', overflow: 'visible', overflowY: 'visible', overflowX: 'visible' }}>
            {/* Рендерим карточки от последней к первой для правильного DOM порядка */}
            {[...visibleCards].reverse().map((card, reverseIndex) => {
              // reverseIndex: 2, 1, 0 для 3 карточек
              // actualIndex: 0, 1, 2 (0 = верхняя карточка)
              const actualIndex = visibleCards.length - 1 - reverseIndex;
              const isTopCard = actualIndex === 0;
              
              return (
                <VanillaSwipeCard
                  key={`${card.vacancy.id}-${currentIndex + actualIndex}`}
                  vacancy={card.vacancy}
                  relevance={card.relevance_score}
                  reasons={card.reasons}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onCardClick={isTopCard ? handleCardClick : undefined}
                  isDraggable={isTopCard}
                  style={{
                    zIndex: 50 + (visibleCards.length - actualIndex), // z-index выше Navigation (5)
                    scale: 1 - actualIndex * 0.04,                     // Верхняя = 1.0, остальные меньше
                    y: actualIndex * 16,                               // Верхняя = 0, остальные ниже
                  }}
                />
              );
            })}
          </div>

          {/* Кнопки */}
          <div className="flex gap-4 md:gap-6 items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwipeLeft}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2"
              disabled={!currentVacancy}
            >
              <X className="h-8 w-8 md:h-10 md:w-10 text-red-500" strokeWidth={3} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleUndo}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2"
              disabled={!canUndo}
            >
              <RotateCcw className="h-6 w-6 md:h-7 md:w-7 text-yellow-500" strokeWidth={2.5} />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setFiltersOpen(true)}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2"
            >
              <Settings className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" strokeWidth={2.5} />
            </Button>

            <Button
              size="icon"
              onClick={handleSwipeRight}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              disabled={!currentVacancy}
            >
              <Heart className="h-8 w-8 md:h-10 md:w-10" strokeWidth={3} />
            </Button>
          </div>
        </div>
      </div>

      <FiltersDialog open={filtersOpen} onOpenChange={setFiltersOpen} />
    </>
  );
}
