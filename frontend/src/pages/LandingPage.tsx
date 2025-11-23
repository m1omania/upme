import { authApi } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';

export default function LandingPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <Container maxWidth="md">
        <div className="min-h-screen flex flex-col items-center justify-center gap-8 py-8">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl mb-2">UpMe</CardTitle>
              <CardDescription className="text-xl">
                Job Swiper для HH.ru
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">
                Автоматическая подача откликов на вакансии с AI-генерацией писем и геймификацией
              </p>
              <Button
                size="lg"
                onClick={handleStart}
                className="mt-4"
              >
                Начать с HH.ru
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
