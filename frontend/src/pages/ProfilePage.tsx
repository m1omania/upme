import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userApi } from '../services/api';
import type { Resume, Filters } from '../../../shared/types';
import { Loader2 } from 'lucide-react';

interface ProfileData {
  id: number;
  email: string;
  hh_user_id: string;
  created_at: string;
  resumes: Resume[];
  filters: Filters;
}

interface HhUserInfo {
  userInfo: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    phone?: string;
    is_applicant?: boolean;
    is_employer?: boolean;
    is_admin?: boolean;
    is_in_search?: boolean;
    [key: string]: any;
  };
  negotiations?: any;
  savedVacancies?: any[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [hhInfo, setHhInfo] = useState<HhUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [hhInfoLoading, setHhInfoLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<Filters>>({});
  const [savingFilters, setSavingFilters] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        const data = response.data as ProfileData;
        setProfile(data);
        // Устанавливаем резюме из профиля
        if (data.resumes && data.resumes.length > 0) {
          setResumes(data.resumes);
        }
        setFilters({
          salary_min: data.filters.salary_min || undefined,
          salary_max: data.filters.salary_max || undefined,
          experience_level: data.filters.experience_level || undefined,
          location: data.filters.location || undefined,
          skills: data.filters.skills || [],
        });
      } else {
        setError(response.error || 'Не удалось загрузить профиль');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке профиля');
    } finally {
      setLoading(false);
    }
  };

  const [resumes, setResumes] = useState<Resume[]>([]);

  const loadResume = async () => {
    setResumeLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await userApi.getResume();
      if (response.success && response.data) {
        // response.data теперь всегда массив
        const resumesData = Array.isArray(response.data) ? response.data : [response.data];
        console.log('Loaded resumes:', resumesData.length, resumesData);
        
        setResumes(resumesData);
        
        if (resumesData.length === 0) {
          setError('У вас нет активных (опубликованных) резюме. Опубликуйте резюме на HH.ru и возвращайтесь.');
        } else {
          setSuccess(`Успешно загружено ${resumesData.length} опубликованных резюме из HH.ru!`);
        }
        await loadProfile();
      } else {
        setError(response.error || 'Не удалось загрузить резюме');
      }
    } catch (err: any) {
      console.error('Error loading resumes:', err);
      setError(err.message || 'Ошибка при загрузке резюме');
    } finally {
      setResumeLoading(false);
    }
  };

  const loadHhInfo = async () => {
    setHhInfoLoading(true);
    try {
      const response = await userApi.getHhInfo();
      if (response.success && response.data) {
        setHhInfo(response.data as HhUserInfo);
      }
    } catch (err: any) {
      // Не показываем ошибку, если не удалось загрузить информацию из HH.ru
      console.warn('Failed to load HH.ru info:', err);
    } finally {
      setHhInfoLoading(false);
    }
  };

  const saveFilters = async () => {
    setSavingFilters(true);
    setError(null);
    try {
      const response = await userApi.updateFilters(filters);
      if (response.success) {
        setSuccess('Фильтры успешно сохранены!');
        await loadProfile();
      } else {
        setError(response.error || 'Не удалось сохранить фильтры');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении фильтров');
    } finally {
      setSavingFilters(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadHhInfo();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Container>
    );
  }

  if (error && !profile) {
    return (
      <Container maxWidth="lg">
        <div className="py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                {error}
              </div>
              <Button onClick={loadProfile} className="mt-4">
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <div className="py-8">
        <h1 className="text-4xl font-bold mb-8">Профиль</h1>

        {/* Информация о пользователе */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Информация о пользователе</CardTitle>
              <Button 
                onClick={loadHhInfo} 
                disabled={hhInfoLoading}
                variant="outline"
                size="sm"
              >
                {hhInfoLoading ? 'Загрузка...' : 'Обновить из HH.ru'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Email:</span>
                <p className="font-medium">{profile.email}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">ID в HH.ru:</span>
                <p className="font-medium">{profile.hh_user_id}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Дата регистрации:</span>
                <p className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Полная информация из HH.ru */}
            {hhInfo?.userInfo && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3 text-lg">Данные из HH.ru</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hhInfo.userInfo.first_name && (
                    <div>
                      <span className="text-sm text-muted-foreground">Имя:</span>
                      <p className="font-medium">{hhInfo.userInfo.first_name}</p>
                    </div>
                  )}
                  {hhInfo.userInfo.last_name && (
                    <div>
                      <span className="text-sm text-muted-foreground">Фамилия:</span>
                      <p className="font-medium">{hhInfo.userInfo.last_name}</p>
                    </div>
                  )}
                  {hhInfo.userInfo.middle_name && (
                    <div>
                      <span className="text-sm text-muted-foreground">Отчество:</span>
                      <p className="font-medium">{hhInfo.userInfo.middle_name}</p>
                    </div>
                  )}
                  {hhInfo.userInfo.phone && (
                    <div>
                      <span className="text-sm text-muted-foreground">Телефон:</span>
                      <p className="font-medium">{hhInfo.userInfo.phone}</p>
                    </div>
                  )}
                  {hhInfo.userInfo.is_applicant !== undefined && (
                    <div>
                      <span className="text-sm text-muted-foreground">Соискатель:</span>
                      <p className="font-medium">
                        {hhInfo.userInfo.is_applicant ? 'Да' : 'Нет'}
                      </p>
                    </div>
                  )}
                  {hhInfo.userInfo.is_employer !== undefined && (
                    <div>
                      <span className="text-sm text-muted-foreground">Работодатель:</span>
                      <p className="font-medium">
                        {hhInfo.userInfo.is_employer ? 'Да' : 'Нет'}
                      </p>
                    </div>
                  )}
                  {hhInfo.userInfo.is_in_search !== undefined && (
                    <div>
                      <span className="text-sm text-muted-foreground">В активном поиске:</span>
                      <p className="font-medium">
                        {hhInfo.userInfo.is_in_search ? (
                          <span className="text-green-600">Да</span>
                        ) : (
                          <span className="text-muted-foreground">Нет</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {hhInfoLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Загрузка данных из HH.ru...</span>
              </div>
            )}

            {!hhInfo && !hhInfoLoading && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Нажмите "Обновить из HH.ru" для загрузки полной информации
              </div>
            )}
          </CardContent>
        </Card>

        {/* Резюме */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Резюме из HH.ru ({resumes.length})</CardTitle>
              <Button 
                onClick={loadResume} 
                disabled={resumeLoading}
                variant="outline"
                size="sm"
              >
                {resumeLoading ? 'Загрузка...' : 'Обновить все резюме'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded text-green-700">
                {success}
              </div>
            )}

            {resumes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  У вас нет активных (опубликованных) резюме.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Опубликуйте резюме на HH.ru и возвращайтесь.
                </p>
                <Button onClick={loadResume} disabled={resumeLoading}>
                  {resumeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    'Обновить список резюме'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {resumes.map((resume: any, index: number) => {
                  const hhData = resume.hh_data || {};
                  
                  // Получаем статус - может быть объектом {id, name} или строкой
                  let statusName = 'Неизвестно';
                  let statusId = null;
                  
                  if (hhData.status) {
                    if (typeof hhData.status === 'string') {
                      statusName = hhData.status;
                    } else if (hhData.status.name) {
                      statusName = hhData.status.name;
                      statusId = hhData.status.id;
                    } else if (hhData.status.id) {
                      statusName = hhData.status.id;
                      statusId = hhData.status.id;
                    }
                  }
                  
                  // Проверяем статус публикации - только точные совпадения
                  const statusLower = statusName.toLowerCase().trim();
                  
                  // Сначала проверяем на "не опубликовано" (чтобы не перехватить "не опубликовано" как "опубликовано")
                  const isNotPublished = 
                    statusLower === 'не опубликовано' ||
                    statusLower === 'not_published' ||
                    statusLower === 'draft' ||
                    statusLower === 'черновик' ||
                    statusId === 'not_published' ||
                    statusId === 'draft';
                  
                  // Точные совпадения для "опубликовано" (только если не "не опубликовано")
                  const isPublished = !isNotPublished && (
                    statusLower === 'опубликовано' ||
                    statusLower === 'published' ||
                    statusId === 'published' ||
                    statusId === 'publish'
                  );
                  
                  return (
                    <div key={resume.id || index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{resume.title}</h4>
                          <p className="text-sm text-muted-foreground">ID резюме в HH.ru: {resume.hh_resume_id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : isNotPublished
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {isPublished 
                              ? 'Опубликовано' 
                              : isNotPublished 
                              ? 'Не опубликовано' 
                              : (statusName !== 'Неизвестно' ? statusName : 'Неизвестный статус')}
                          </span>
                          {hhData.views_count !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              Просмотров: {hhData.views_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {hhData.first_name || hhData.last_name ? (
                        <div>
                          <h5 className="font-medium mb-1 text-sm text-muted-foreground">ФИО:</h5>
                          <p className="font-medium">
                            {[hhData.last_name, hhData.first_name, hhData.middle_name]
                              .filter(Boolean)
                              .join(' ')}
                          </p>
                        </div>
                      ) : null}

                      {hhData.age && (
                        <div>
                          <h5 className="font-medium mb-1 text-sm text-muted-foreground">Возраст:</h5>
                          <p>{hhData.age} лет</p>
                        </div>
                      )}

                      <div>
                        <h5 className="font-medium mb-1 text-sm text-muted-foreground">Опыт работы:</h5>
                        {(() => {
                          // Пытаемся получить опыт из total_experience_months
                          let totalMonths = hhData.total_experience_months;
                          
                          // Если нет, вычисляем из массива experience
                          if (!totalMonths && hhData.experience && Array.isArray(hhData.experience) && hhData.experience.length > 0) {
                            totalMonths = 0;
                            hhData.experience.forEach((exp: any) => {
                              if (exp.start) {
                                const startDate = new Date(exp.start);
                                const endDate = exp.end ? new Date(exp.end) : new Date();
                                const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                             (endDate.getMonth() - startDate.getMonth());
                                if (months > 0) {
                                  totalMonths += months;
                                }
                              }
                            });
                          }
                          
                          if (totalMonths && totalMonths > 0) {
                            const years = Math.floor(totalMonths / 12);
                            const months = totalMonths % 12;
                            return (
                              <p className="font-medium">
                                {years} {years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} {months > 0 ? `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}` : ''}
                              </p>
                            );
                          }
                          
                          return <p className="text-muted-foreground text-sm">Не указан</p>;
                        })()}
                      </div>

                      {hhData.experience && hhData.experience.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Места работы:</h5>
                          <div className="space-y-2">
                            {hhData.experience.map((exp: any, expIndex: number) => (
                              <div key={expIndex} className="border-l-2 border-blue-200 pl-3 py-1">
                                <p className="font-medium">{exp.position || 'Должность не указана'}</p>
                                {exp.company && <p className="text-sm text-muted-foreground">{exp.company}</p>}
                                {exp.start && (
                                  <p className="text-xs text-muted-foreground">
                                    {exp.start} - {exp.end || 'по настоящее время'}
                                  </p>
                                )}
                                {exp.description && (
                                  <p className="text-sm mt-1 text-muted-foreground">{exp.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {resume.skills && resume.skills.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Навыки:</h5>
                          <div className="flex flex-wrap gap-2">
                            {resume.skills.map((skill: string, skillIndex: number) => (
                              <span
                                key={skillIndex}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {hhData.education && hhData.education.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Образование:</h5>
                          <div className="space-y-2">
                            {hhData.education.map((edu: any, eduIndex: number) => (
                              <div key={eduIndex} className="text-sm">
                                {edu.level && (
                                  <p className="font-medium">{edu.level.name}</p>
                                )}
                                {edu.primary && edu.primary.map((prim: any, primIndex: number) => (
                                  <div key={primIndex} className="ml-4 text-muted-foreground">
                                    <p>{prim.name}</p>
                                    {prim.organization && <p className="text-xs">{prim.organization}</p>}
                                    {prim.year && <p className="text-xs">Год: {prim.year}</p>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {hhData.language && hhData.language.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2">Языки:</h5>
                          <div className="flex flex-wrap gap-2">
                            {hhData.language.map((lang: any, langIndex: number) => (
                              <span
                                key={langIndex}
                                className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                              >
                                {lang.name} {lang.level ? `(${lang.level.name})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {hhData.created_at && (
                        <div className="text-xs text-muted-foreground border-t pt-2">
                          Создано: {new Date(hhData.created_at).toLocaleDateString('ru-RU')}
                          {hhData.updated_at && (
                            <> | Обновлено: {new Date(hhData.updated_at).toLocaleDateString('ru-RU')}</>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Фильтры поиска */}
        <Card>
          <CardHeader>
            <CardTitle>Фильтры поиска вакансий</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button 
              onClick={saveFilters} 
              disabled={savingFilters}
              className="w-full md:w-auto"
            >
              {savingFilters ? 'Сохранение...' : 'Сохранить фильтры'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
