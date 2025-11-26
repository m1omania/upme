import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userApi } from '../services/api';
import type { Filters } from '../../../shared/types';

interface FiltersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FiltersDialog({ open, onOpenChange }: FiltersDialogProps) {
  const [filters, setFilters] = useState<Partial<Filters>>({});
  const [savingFilters, setSavingFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadFilters();
    }
  }, [open]);

  const loadFilters = async () => {
    setLoading(true);
    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        const data = response.data as any;
        setFilters({
          salary_min: data.filters?.salary_min || undefined,
          salary_max: data.filters?.salary_max || undefined,
          experience_level: data.filters?.experience_level || undefined,
          location: data.filters?.location || undefined,
          skills: data.filters?.skills || [],
        });
      }
    } catch (err) {
      console.error('Failed to load filters:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveFilters = async () => {
    setSavingFilters(true);
    try {
      const response = await userApi.updateFilters(filters);
      if (response.success) {
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Failed to save filters:', err);
    } finally {
      setSavingFilters(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Фильтры поиска вакансий</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Минимальная зарплата (₽)</label>
                <Input
                  type="number"
                  placeholder="Например: 50000"
                  value={filters.salary_min || ''}
                  onChange={(e) => setFilters({ ...filters, salary_min: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Максимальная зарплата (₽)</label>
                <Input
                  type="number"
                  placeholder="Например: 200000"
                  value={filters.salary_max || ''}
                  onChange={(e) => setFilters({ ...filters, salary_max: e.target.value ? parseInt(e.target.value) : undefined })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Уровень опыта</label>
                <Input
                  placeholder="Например: middle, senior"
                  value={filters.experience_level || ''}
                  onChange={(e) => setFilters({ ...filters, experience_level: e.target.value || undefined })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Локация</label>
                <Input
                  placeholder="Например: Москва, Санкт-Петербург"
                  value={filters.location || ''}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Навыки (через запятую)</label>
              <Input
                placeholder="Например: JavaScript, React, TypeScript"
                value={Array.isArray(filters.skills) ? filters.skills.join(', ') : ''}
                onChange={(e) => {
                  const skills = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  setFilters({ ...filters, skills });
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={saveFilters} disabled={savingFilters || loading}>
            {savingFilters ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

