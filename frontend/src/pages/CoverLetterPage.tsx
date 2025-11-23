import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi, applicationsApi, vacanciesApi } from '../services/api';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

export default function CoverLetterPage() {
  const { vacancyId } = useParams<{ vacancyId: string }>();
  const navigate = useNavigate();
  const [letter, setLetter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: vacancy } = useQuery({
    queryKey: ['vacancy', vacancyId],
    queryFn: async () => {
      if (!vacancyId) return null;
      const response = await vacanciesApi.getById(parseInt(vacancyId));
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: !!vacancyId,
  });

  useEffect(() => {
    if (vacancyId && !letter) {
      generateLetter();
    }
  }, [vacancyId]);

  const generateLetter = async () => {
    if (!vacancyId) return;
    setIsGenerating(true);
    try {
      const response = await aiApi.generateLetter(parseInt(vacancyId));
      if (response.success && response.data) {
        setLetter(response.data.letter);
      }
    } catch (error) {
      console.error('Error generating letter:', error);
    } finally {
      setIsGenerating(false);
    }
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

  if (!vacancy) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generateLetter}
                  >
                    Перегенерировать
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!letter.trim() || createApplication.isPending}
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
