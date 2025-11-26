import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Sparkles } from 'lucide-react';

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: number;
  tags: string[];
  imageUrl?: string;
}

// Моковые данные по умолчанию
export const defaultPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Как эффективно искать работу в 2024 году',
    excerpt: 'Современные методы поиска работы и использование AI-инструментов для повышения эффективности.',
    content: `
      <h2>Введение</h2>
      <p>Поиск работы в 2024 году кардинально изменился благодаря развитию технологий и искусственного интеллекта. Современные соискатели имеют доступ к инструментам, которые делают процесс поиска работы более эффективным и целенаправленным.</p>
      
      <h2>Использование AI-инструментов</h2>
      <p>Искусственный интеллект может помочь вам на всех этапах поиска работы:</p>
      <ul>
        <li>Автоматическая генерация сопроводительных писем</li>
        <li>Оптимизация резюме под конкретные вакансии</li>
        <li>Анализ требований работодателей</li>
        <li>Подбор релевантных вакансий</li>
      </ul>
      
      <h2>Стратегия поиска</h2>
      <p>Эффективный поиск работы требует системного подхода. Важно не только активно откликаться на вакансии, но и отслеживать свой прогресс, анализировать результаты и постоянно улучшать свой профиль.</p>
      
      <h2>Заключение</h2>
      <p>Используя современные инструменты и правильную стратегию, вы можете значительно ускорить процесс поиска работы и найти подходящую позицию быстрее.</p>
    `,
    author: 'Команда UpMe',
    publishedAt: '2024-01-15',
    readTime: 5,
    tags: ['Карьера', 'Советы'],
  },
  {
    id: 2,
    title: '10 способов улучшить ваше резюме',
    excerpt: 'Практические советы по созданию резюме, которое привлечет внимание HR-специалистов.',
    content: `
      <h2>1. Используйте ключевые слова</h2>
      <p>Включайте релевантные ключевые слова из описания вакансии в свое резюме. Это поможет пройти автоматический отбор.</p>
      
      <h2>2. Структурируйте информацию</h2>
      <p>Используйте четкую структуру с заголовками и разделами. Это облегчит чтение и понимание вашего опыта.</p>
      
      <h2>3. Добавьте количественные показатели</h2>
      <p>Вместо общих фраз используйте конкретные цифры: "увеличил продажи на 30%", "управлял командой из 10 человек".</p>
      
      <h2>4. Адаптируйте резюме под вакансию</h2>
      <p>Каждое резюме должно быть адаптировано под конкретную вакансию. Выделяйте наиболее релевантный опыт.</p>
      
      <h2>5. Проверьте орфографию</h2>
      <p>Опечатки и грамматические ошибки создают негативное впечатление. Используйте проверку орфографии.</p>
      
      <h2>6. Используйте профессиональный формат</h2>
      <p>Выберите чистый, профессиональный дизайн. Избегайте излишних декоративных элементов.</p>
      
      <h2>7. Добавьте ссылки на портфолио</h2>
      <p>Если у вас есть портфолио или профили в профессиональных сетях, обязательно добавьте ссылки.</p>
      
      <h2>8. Опишите достижения, а не обязанности</h2>
      <p>Фокусируйтесь на результатах и достижениях, а не просто на списке обязанностей.</p>
      
      <h2>9. Обновите контактную информацию</h2>
      <p>Убедитесь, что все контактные данные актуальны и профессиональны.</p>
      
      <h2>10. Регулярно обновляйте резюме</h2>
      <p>Добавляйте новый опыт и навыки по мере их приобретения. Актуальное резюме всегда готово к использованию.</p>
    `,
    author: 'Команда UpMe',
    publishedAt: '2024-01-10',
    readTime: 7,
    tags: ['Резюме', 'HR'],
  },
  {
    id: 3,
    title: 'Искусственный интеллект в рекрутинге',
    excerpt: 'Как AI меняет процесс найма и что это значит для соискателей.',
    content: `
      <h2>Революция в рекрутинге</h2>
      <p>Искусственный интеллект кардинально меняет процесс найма сотрудников. От автоматического отбора резюме до проведения первичных интервью - AI становится неотъемлемой частью рекрутинга.</p>
      
      <h2>Как AI используется в найме</h2>
      <p>Современные HR-системы используют AI для:</p>
      <ul>
        <li>Автоматического анализа резюме и отбора кандидатов</li>
        <li>Оценки соответствия навыков требованиям вакансии</li>
        <li>Проведения первичных скрининговых интервью</li>
        <li>Предсказания успешности кандидата на позиции</li>
      </ul>
      
      <h2>Что это значит для соискателей</h2>
      <p>Для соискателей это означает необходимость адаптации к новым требованиям. Важно понимать, как работают AI-системы и как оптимизировать свое резюме и профиль для прохождения автоматического отбора.</p>
      
      <h2>Будущее рекрутинга</h2>
      <p>В будущем AI будет играть еще более важную роль в процессе найма. Соискателям важно быть готовыми к этим изменениям и использовать новые инструменты в свою пользу.</p>
    `,
    author: 'Команда UpMe',
    publishedAt: '2024-01-05',
    readTime: 6,
    tags: ['AI', 'Технологии'],
  },
];

export default function BlogPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);

  // Загружаем статьи из localStorage или используем дефолтные
  useEffect(() => {
    const savedPosts = localStorage.getItem('blogPosts');
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed);
          return;
        }
      } catch (e) {
        console.error('Error parsing blog posts from localStorage:', e);
      }
    }
    // Если нет сохраненных статей, используем дефолтные
    setPosts(defaultPosts);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePostClick = (postId: number) => {
    navigate(`/blog/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <Container maxWidth="lg">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <button
                  onClick={() => navigate('/')}
                  className="text-2xl font-bold hover:text-primary transition-colors cursor-pointer"
                >
                  UpMe
                </button>
              </div>
              <nav className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/blog')}
                  className="text-base"
                >
                  Блог
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/pricing')}
                  className="text-base"
                >
                  Цены
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-base"
                >
                  Главная
                </Button>
              </nav>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Container maxWidth="lg">
          <div className="py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Блог</h1>
              <p className="text-xl text-muted-foreground">
                Полезные статьи о поиске работы, карьере и развитии
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handlePostClick(post.id)}
                >
                  {post.imageUrl && (
                    <div className="w-full h-48 bg-muted rounded-t-lg overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{post.readTime} мин</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Автор: {post.author}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Пока нет опубликованных записей
                </p>
              </div>
            )}
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30 mt-auto">
        <Container maxWidth="lg">
          <div className="text-center text-muted-foreground">
            <p>© 2024 UpMe. Все права защищены.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

