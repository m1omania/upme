import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import RelevanceBadge from '../components/RelevanceBadge';
import { vacanciesApi } from '../services/api';
import { Loader2, X, Heart, ArrowLeft } from 'lucide-react';

export default function VacancyDetailPage() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const vacancyIdNum = vacancyId ? parseInt(vacancyId) : null;
  
  // Получаем индекс карточки из state для возврата назад
  const cardIndex = (location.state as { cardIndex?: number } | null)?.cardIndex;

  // Загружаем детальную информацию о вакансии
  const { data: vacancyData, isLoading } = useQuery({
    queryKey: ['vacancy', vacancyIdNum],
    queryFn: async () => {
      if (!vacancyIdNum) return null;
      const response = await vacanciesApi.getById(vacancyIdNum);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: !!vacancyIdNum,
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
  });

  // Загружаем релевантность
  const { data: relevanceData } = useQuery({
    queryKey: ['vacancy-relevance', vacancyIdNum],
    queryFn: async () => {
      if (!vacancyIdNum) return null;
      const response = await vacanciesApi.calculateRelevance(vacancyIdNum);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: !!vacancyIdNum,
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
  });

  const vacancy = vacancyData;
  const relevance = relevanceData || null;

  const handleBack = () => {
    // Возвращаемся на страницу свайпа, сохраняя индекс карточки
    navigate('/swipe', { state: { cardIndex } });
  };

  const handleSkip = () => {
    // Пропускаем вакансию и переходим на следующую
    navigate('/swipe', { state: { skipVacancyId: vacancyIdNum, cardIndex: cardIndex !== undefined ? cardIndex : undefined } });
  };

  const handleApply = () => {
    // Переходим на страницу создания письма
    if (vacancyIdNum) {
      navigate(`/swipe/${vacancyIdNum}/letter`);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

  if (!vacancy) {
    return (
      <Container>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Вакансия не найдена</h1>
            <p className="text-muted-foreground mb-4">Не удалось загрузить информацию о вакансии</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться назад
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <div className="min-h-screen py-6 pb-24 md:pb-6">
        {/* Кнопка назад */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>

        {/* Заголовок */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-2">{vacancy.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{vacancy.company}</p>
            </div>
            {relevance && (
              <RelevanceBadge score={relevance.relevance_score} />
            )}
          </div>
          
          {/* Зарплата */}
          {vacancy.salary && (
            <Badge variant="secondary" className="text-base px-3 py-1">
              {vacancy.salary}
            </Badge>
          )}
        </div>

        {/* Контент */}
        <div className="space-y-6 mb-8">
          {/* Описание */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Описание вакансии:</h2>
            <div 
              className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap break-words bg-card border rounded-lg p-4"
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ 
                __html: vacancy.description 
                  ? vacancy.description.replace(/\n/g, '<br />').replace(/\r/g, '')
                  : 'Описание не доступно'
              }}
            />
          </div>

          {/* Релевантность */}
          {relevance && relevance.reasons.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Почему эта вакансия подходит:</h2>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="mb-3">
                  <span className="text-sm text-muted-foreground">Общая оценка: </span>
                  <span className="font-semibold text-lg">{relevance.relevance_score}%</span>
                </div>
                <ul className="space-y-2">
                  {relevance.reasons.map((reason: string, index: number) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Требования */}
          {vacancy.requirements && vacancy.requirements.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Требования:</h2>
              <div className="flex flex-wrap gap-2">
                {vacancy.requirements.map((req: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto border-t md:border-t-0 bg-background md:bg-transparent pt-4 pb-safe md:pt-0 md:pb-0">
          <div className="container max-w-lg mx-auto px-4 md:px-0">
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleSkip}
                className="gap-2 flex-1"
              >
                <X className="h-5 w-5" />
                Пропустить
              </Button>
              <Button
                size="lg"
                onClick={handleApply}
                className="gap-2 flex-1"
              >
                <Heart className="h-5 w-5" />
                Отклик
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
