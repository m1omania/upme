import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error') || 'Неизвестная ошибка';

  return (
    <Container maxWidth="sm">
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 py-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-4xl text-destructive mb-2">
              Ошибка авторизации
            </CardTitle>
            <CardDescription className="text-base">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Вернуться на главную
            </Button>
            <Button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/';
              }}
            >
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
