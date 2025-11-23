import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RelevanceBadge from './RelevanceBadge';
import { vacanciesApi } from '../services/api';
import { Loader2, X, Heart } from 'lucide-react';

interface VacancyDetailModalProps {
  vacancyId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRelevance?: {
    relevance_score: number;
    reasons: string[];
  };
  onSkip?: () => void;
  onApply?: () => void;
}

export default function VacancyDetailModal({
  vacancyId,
  open,
  onOpenChange,
  initialRelevance,
  onSkip,
  onApply,
}: VacancyDetailModalProps) {
  // Загружаем детальную информацию о вакансии из кэша (БД)
  const { data: vacancyData, isLoading } = useQuery({
    queryKey: ['vacancy', vacancyId],
    queryFn: async () => {
      if (!vacancyId) return null;
      const response = await vacanciesApi.getById(vacancyId);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: open && !!vacancyId,
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
  });

  // Загружаем релевантность, если не передана
  const { data: relevanceData } = useQuery({
    queryKey: ['vacancy-relevance', vacancyId],
    queryFn: async () => {
      if (!vacancyId) return null;
      const response = await vacanciesApi.calculateRelevance(vacancyId);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: open && !!vacancyId && !initialRelevance,
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
  });

  const vacancy = vacancyData;
  const relevance = initialRelevance || relevanceData || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="text-left">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : vacancy ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <DialogTitle className="text-2xl mb-2 text-left">{vacancy.title}</DialogTitle>
                  <DialogDescription className="text-lg text-left">
                    {vacancy.company}
                  </DialogDescription>
                </div>
                {relevance && (
                  <RelevanceBadge score={relevance.relevance_score} />
                )}
              </div>
              
              {/* Зарплата */}
              {vacancy.salary && (
                <Badge variant="secondary" className="text-base px-3 py-1 w-fit">
                  {vacancy.salary}
                </Badge>
              )}
            </>
          ) : (
            <>
              <DialogTitle>Вакансия не найдена</DialogTitle>
              <DialogDescription>Не удалось загрузить информацию о вакансии</DialogDescription>
            </>
          )}
        </DialogHeader>

        {vacancy && (
          <div className="flex-1 overflow-y-auto space-y-6 mt-4">
              {/* Описание - полное, без обрезки */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Описание вакансии:</h3>
                <div 
                  className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap break-words"
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{ 
                    __html: vacancy.description 
                      ? vacancy.description.replace(/\n/g, '<br />').replace(/\r/g, '')
                      : 'Описание не доступно'
                  }}
                />
              </div>

              {/* Релевантность - под описанием */}
              {relevance && relevance.reasons.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Сводка по релевантности:</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="mb-3">
                      <span className="text-sm text-muted-foreground">Общая оценка: </span>
                      <span className="font-semibold text-lg">{relevance.relevance_score}%</span>
                    </div>
                    <ul className="space-y-2">
                      {relevance.reasons.map((reason, index) => (
                        <li key={index} className="text-sm flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
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
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Требования:</h3>
                  <div className="flex flex-wrap gap-2">
                    {vacancy.requirements.map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {vacancy && (
          <DialogFooter className="mt-6 pt-4 border-t">
            <div className="flex gap-4 w-full">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (onSkip) onSkip();
                  onOpenChange(false);
                }}
                className="gap-2 flex-1"
              >
                <X className="h-5 w-5" />
                Пропустить
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (onApply) onApply();
                  onOpenChange(false);
                }}
                className="gap-2 flex-1"
              >
                <Heart className="h-5 w-5" />
                Отклик
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

