import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi, applicationsApi, vacanciesApi } from '../services/api';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';
import BalanceLimitDialog from '../components/BalanceLimitDialog';

export default function CoverLetterPage() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [letter, setLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);

  const { data: vacancy, error: vacancyError } = useQuery({
    queryKey: ['vacancy', vacancyId],
    queryFn: async () => {
      if (!vacancyId) return null;
      const response = await vacanciesApi.getById(parseInt(vacancyId));
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Вакансия не найдена');
    },
    enabled: !!vacancyId,
    retry: false,
  });

  useEffect(() => {
    // Генерируем письмо только после загрузки вакансии
    if (vacancyId && vacancy && !letter && !isGenerating) {
      generateLetter();
    }
  }, [vacancyId, vacancy, letter, isGenerating]);

  const generateLetter = async () => {
    if (!vacancyId) {
      alert('ID вакансии не указан');
      return;
    }
    if (!vacancy) {
      console.log('Waiting for vacancy to load...');
      return;
    }
    setIsGenerating(true);
    try {
      const response = await aiApi.generateLetter(parseInt(vacancyId));
      if (response.success && response.data) {
        setLetter(response.data.letter);
        // Обновляем баланс после успешной генерации
        queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      } else {
        console.error('Failed to generate letter:', response.error);
        const errorMsg = response.error || 'Не удалось сгенерировать письмо';
        alert(`Ошибка генерации: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error generating letter:', error);
      let errorMessage = 'Ошибка при генерации письма';
      if (error.response) {
        if (error.response.status === 402) {
          // Ошибка баланса - показываем модальное окно
          setShowBalanceDialog(true);
          setIsGenerating(false);
          return;
        } else if (error.response.status === 404) {
          errorMessage = 'Роут генерации письма не найден. Проверьте, что бэкенд запущен.';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = `Ошибка сервера: ${error.response.status}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const improveLetter = useMutation({
    mutationFn: async () => {
      if (!letter.trim()) throw new Error('Письмо пустое');
      const response = await aiApi.improveLetter(letter);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось улучшить письмо');
      }
      return response.data.letter;
    },
    onSuccess: (improvedLetter) => {
      setLetter(improvedLetter);
    },
    onError: (error: any) => {
      console.error('Error improving letter:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка при улучшении письма';
      alert(errorMessage);
    },
  });

  const handleImprove = () => {
    if (!letter.trim()) {
      alert('Письмо пустое');
      return;
    }
    improveLetter.mutate();
  };

  const createApplication = useMutation({
    mutationFn: async (coverLetter: string) => {
      if (!vacancyId) throw new Error('Vacancy ID is required');
      const response = await applicationsApi.create({
        vacancy_id: parseInt(vacancyId),
        cover_letter: coverLetter,
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to create application');
      }
      return response.data;
    },
    onSuccess: () => {
      navigate('/swipe', { state: { message: 'Отклик успешно отправлен!' } });
    },
  });

  const handleSubmit = () => {
    if (letter.trim()) {
      createApplication.mutate(letter);
    }
  };

  if (!vacancy && !vacancyError) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

  if (vacancyError) {
    return (
      <Container maxWidth="md">
        <div className="py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/swipe')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-destructive font-semibold">
                  Ошибка загрузки вакансии
                </p>
                <p className="text-muted-foreground">
                  {vacancyError instanceof Error ? vacancyError.message : 'Вакансия не найдена'}
                </p>
                <Button onClick={() => navigate('/swipe')}>
                  Вернуться к списку вакансий
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="h-[100dvh] flex flex-col">
      <div className="py-8 pb-24 md:pb-8 flex flex-col flex-1 min-h-0">
        <Button
          variant="outline"
          onClick={() => {
            // Возвращаемся на страницу свайпа с сохраненным индексом карточки
            const state = location.state as { cardIndex?: number } | null;
            const cardIndex = state?.cardIndex;
            if (cardIndex !== undefined) {
              navigate('/swipe', { state: { cardIndex } });
            } else {
              navigate('/swipe');
            }
          }}
          className="mb-4 flex-shrink-0 self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <Card className="mb-4 flex-shrink-0">
          <CardHeader>
            <CardTitle>Сопроводительное письмо</CardTitle>
            <p className="text-sm text-muted-foreground">
              Вакансия: {(vacancy as any).title} в {(vacancy as any).company}
            </p>
          </CardHeader>
        </Card>

        {isGenerating ? (
          <div className="flex flex-col items-center justify-center p-8 gap-4 flex-1">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Генерация письма...</p>
          </div>
        ) : (
          <>
            <Textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              placeholder="Сопроводительное письмо будет сгенерировано автоматически..."
              className="flex-1 w-full resize-none"
            />

            {/* Кнопки на десктопе - обычное расположение */}
            <div className="hidden md:flex flex-col gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleImprove}
                disabled={!letter.trim() || improveLetter.isPending}
                className="w-full"
              >
                {improveLetter.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Улучшение...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Улучшить письмо
                  </>
                )}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!letter.trim() || createApplication.isPending}
                size="lg"
                className="w-full"
              >
                {createApplication.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Отправить отклик
                  </>
                )}
              </Button>
            </div>

            {improveLetter.isError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm mt-4">
                {improveLetter.error instanceof Error
                  ? improveLetter.error.message
                  : 'Ошибка при улучшении письма'}
              </div>
            )}

            {createApplication.isError && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md mt-4">
                {createApplication.error instanceof Error
                  ? createApplication.error.message
                  : 'Ошибка при отправке отклика'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Зафиксированные кнопки на мобильных устройствах */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 shadow-lg">
        <div className="flex flex-row gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={handleImprove}
            disabled={!letter.trim() || improveLetter.isPending || isGenerating}
            className="flex-1"
          >
            {improveLetter.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Улучшение...</span>
                <span className="sm:hidden">Улучшить</span>
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Улучшить письмо</span>
                <span className="sm:hidden">Улучшить</span>
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!letter.trim() || createApplication.isPending || isGenerating}
            size="lg"
            className="flex-1"
          >
            {createApplication.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Отправка...</span>
                <span className="sm:hidden">Отправка</span>
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Отправить отклик</span>
                <span className="sm:hidden">Отправить</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Модальное окно о лимите баланса */}
      <BalanceLimitDialog
        open={showBalanceDialog}
        onOpenChange={setShowBalanceDialog}
        onTopUp={() => {
          setShowBalanceDialog(false);
          // TODO: Переход на страницу пополнения баланса
          navigate('/pricing');
        }}
        onContinue={() => {
          setShowBalanceDialog(false);
          // Пользователь может продолжить без генерации письма
          // Письмо остается пустым или пользователь может ввести его вручную
        }}
      />
    </Container>
  );
}
