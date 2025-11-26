import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PricingPage() {
  const navigate = useNavigate();

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
          <div className="py-12">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Цены</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Прозрачное ценообразование. Платите только за то, что используете.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              {/* Генерация отклика */}
              <Card className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl">Генерация отклика</CardTitle>
                    <Badge variant="secondary">AI-генерация</Badge>
                  </div>
                  <CardDescription>
                    Персональное сопроводительное письмо, созданное искусственным интеллектом
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">50</span>
                      <span className="text-xl text-muted-foreground">₽</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">за один отклик</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Персональное письмо на основе вашего резюме</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Анализ требований вакансии</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Уникальный контент для каждой вакансии</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Автоматическое добавление контактов</span>
                    </li>
                  </ul>

                  <Button className="w-full" size="lg">
                    <Zap className="mr-2 h-4 w-4" />
                    Начать использовать
                  </Button>
                </CardContent>
              </Card>

              {/* Автоматический отклик */}
              <Card className="relative border-primary">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Популярно</Badge>
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl">Автоматический отклик</CardTitle>
                    <Badge variant="secondary">Полный цикл</Badge>
                  </div>
                  <CardDescription>
                    Генерация письма и автоматическая отправка отклика на вакансию
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">75</span>
                      <span className="text-xl text-muted-foreground">₽</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">за один отклик</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Всё из тарифа "Генерация отклика"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Автоматическая отправка на HH.ru</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Подбор подходящего резюме</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Экономия времени</span>
                    </li>
                  </ul>

                  <Button className="w-full" size="lg" variant="default">
                    <Zap className="mr-2 h-4 w-4" />
                    Начать использовать
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* How it works */}
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center mb-4">Как это работает</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Выбираете вакансию</h3>
                        <p className="text-sm text-muted-foreground">
                          Просматриваете релевантные вакансии и выбираете подходящие
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">AI генерирует письмо</h3>
                        <p className="text-sm text-muted-foreground">
                          Искусственный интеллект создает персональное сопроводительное письмо
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Отправляете отклик</h3>
                        <p className="text-sm text-muted-foreground">
                          Отправляете отклик одним нажатием. Стоимость списывается автоматически
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ */}
            <div className="max-w-3xl mx-auto mt-12">
              <h2 className="text-3xl font-bold text-center mb-8">Часто задаваемые вопросы</h2>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Как происходит оплата?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Оплата происходит автоматически при отправке каждого отклика. 
                      Вы можете пополнить баланс заранее или оплачивать каждый отклик отдельно.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Можно ли отменить отклик?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      После отправки отклика на HH.ru его нельзя отменить. 
                      Стоимость списывается только после успешной отправки.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Есть ли скидки при большом количестве откликов?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Да, мы предлагаем специальные тарифы для активных пользователей. 
                      Свяжитесь с нами для получения персонального предложения.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
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

