import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi, applicationsApi, vacanciesApi } from '../services/api';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';

export default function CoverLetterPage() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const [letter, setLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);

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
      } else {
        console.error('Failed to generate letter:', response.error);
        const errorMsg = response.error || 'Не удалось сгенерировать письмо';
        alert(`Ошибка генерации: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error generating letter:', error);
      let errorMessage = 'Ошибка при генерации письма';
      if (error.response) {
        if (error.response.status === 404) {
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
      if (!response.success) {
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
          <CardHeader>
            <CardTitle>Сопроводительное письмо</CardTitle>
            <p className="text-sm text-muted-foreground">
              Вакансия: {(vacancy as any).title} в {(vacancy as any).company}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-8 gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Генерация письма...</p>
              </div>
            ) : (
              <>
                <Textarea
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  placeholder="Сопроводительное письмо будет сгенерировано автоматически..."
                  className="min-h-[200px]"
                />

                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={handleImprove}
                    disabled={!letter.trim() || isImproving || improveLetter.isPending}
                    className="w-full"
                  >
                    {isImproving || improveLetter.isPending ? (
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
                  <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
                    {improveLetter.error instanceof Error
                      ? improveLetter.error.message
                      : 'Ошибка при улучшении письма'}
                  </div>
                )}

                {createApplication.isError && (
                  <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                    {createApplication.error instanceof Error
                      ? createApplication.error.message
                      : 'Ошибка при отправке отклика'}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
