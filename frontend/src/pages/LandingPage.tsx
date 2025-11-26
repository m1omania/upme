import { authApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Zap, 
  Target, 
  TrendingUp, 
  FileText, 
  Filter,
  Award,
  BarChart3,
  User
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleStart = async () => {
    try {
      const response = await authApi.getAuthUrl();
      if (response.success && response.data) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Свайп вакансий',
      description: 'Просматривайте вакансии как в Tinder — свайпайте вправо, если интересно, влево — если нет. Быстро и удобно.',
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: 'AI-генерация писем',
      description: 'Искусственный интеллект создает персональные сопроводительные письма для каждой вакансии на основе вашего резюме.',
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Автоматические отклики',
      description: 'Отправляйте отклики на вакансии одним нажатием. Система автоматически подберет подходящее резюме.',
    },
    {
      icon: <Filter className="h-8 w-8" />,
      title: 'Умные фильтры',
      description: 'Настройте фильтры по зарплате, опыту, типу занятости и другим параметрам для поиска идеальных вакансий.',
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Геймификация',
      description: 'Зарабатывайте XP, повышайте уровень, поддерживайте стрики активности и получайте достижения за прогресс.',
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Отслеживание прогресса',
      description: 'Анализируйте свою активность, количество откликов, просматривайте статистику и отслеживайте результаты.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <Container maxWidth="lg">
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">UpMe</h1>
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
              </nav>
            </div>
          </header>

          {/* Hero Content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="max-w-3xl space-y-6 mb-12">
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                Найди работу
                <span className="text-primary"> мечты</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Современный способ поиска работы на HH.ru с AI-помощником и геймификацией
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleStart}
                  className="text-lg px-8 py-6"
                >
                  <User className="mr-2 h-5 w-5" />
                  Войти через HH.ru
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <Container maxWidth="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-semibold">{feature.title}</h4>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <Container maxWidth="lg">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h3 className="text-4xl font-bold">Готовы начать?</h3>
            <p className="text-xl text-muted-foreground">
              Присоединяйтесь к тысячам соискателей, которые уже используют UpMe для поиска работы
            </p>
            <Button
              size="lg"
              onClick={handleStart}
              className="text-lg px-8 py-6"
            >
              <User className="mr-2 h-5 w-5" />
              Войти через HH.ru
            </Button>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <Container maxWidth="lg">
          <div className="text-center text-muted-foreground">
            <p>© 2024 UpMe. Все права защищены.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
