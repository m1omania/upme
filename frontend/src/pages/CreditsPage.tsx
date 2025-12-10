import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { userApi } from '../services/api';
import { Coins, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
// Простые уведомления через alert

const CREDIT_PACKAGES = [
  { amount: 10, price: 'Бесплатно', popular: false },
  { amount: 25, price: 'Бесплатно', popular: true },
  { amount: 50, price: 'Бесплатно', popular: false },
  { amount: 100, price: 'Бесплатно', popular: false },
];

export default function CreditsPage() {
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  // Загружаем баланс
  const { data: balanceData, isLoading } = useQuery<number>({
    queryKey: ['user-balance'],
    queryFn: async () => {
      const response = await userApi.getBalance();
      if (response.success && response.data && typeof response.data === 'object' && 'balance' in response.data) {
        return (response.data as { balance: number }).balance;
      }
      return 10;
    },
    refetchInterval: 30000,
  });

  const balance = balanceData ?? 10;

  // Мутация для покупки кредитов
  const purchaseMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await userApi.purchaseCredits(amount);
      if (response.success && response.data) {
        return response.data.balance;
      }
      throw new Error('Failed to purchase credits');
    },
    onSuccess: (newBalance, amount) => {
      queryClient.setQueryData(['user-balance'], newBalance);
      alert(`Успешно! Добавлено ${amount} кредитов. Новый баланс: ${newBalance}`);
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Ошибка при покупке кредитов');
    },
  });

  const handlePurchase = (amount: number) => {
    setSelectedPackage(amount);
    purchaseMutation.mutate(amount);
  };

  return (
    <Container maxWidth="lg">
      <div className="py-8 pb-24 md:pb-8">
        {/* Заголовок */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Coins className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Кредиты</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Используйте кредиты для генерации сопроводительных писем
          </p>
        </div>

        {/* Текущий баланс */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Ваш баланс</span>
              <Badge variant="secondary" className="text-2xl px-4 py-2">
                <Coins className="h-5 w-5 mr-2 inline" />
                {isLoading ? '...' : balance}
              </Badge>
            </CardTitle>
            <CardDescription>
              Каждое письмо стоит 1 кредит
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Пакеты кредитов */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Выберите пакет</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKAGES.map((pkg) => (
              <Card
                key={pkg.amount}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  pkg.popular ? 'border-primary border-2' : ''
                } ${
                  selectedPackage === pkg.amount ? 'ring-2 ring-primary' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Популярный
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-3xl font-bold mb-2">
                    {pkg.amount}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    кредитов
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {pkg.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pkg.amount} писем
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                    onClick={() => handlePurchase(pkg.amount)}
                    disabled={purchaseMutation.isPending && selectedPackage === pkg.amount}
                  >
                    {purchaseMutation.isPending && selectedPackage === pkg.amount ? (
                      'Обработка...'
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Получить
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Информация */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Как это работает?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Каждое сгенерированное сопроводительное письмо стоит 1 кредит</p>
            <p>• Кредиты можно получить бесплатно, выбрав один из пакетов выше</p>
            <p>• Баланс обновляется автоматически после покупки</p>
            <p>• Кредиты не имеют срока действия</p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

