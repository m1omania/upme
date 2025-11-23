import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  return (
    <Container maxWidth="md">
      <div className="py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl">Профиль</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Настройки профиля будут здесь</p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
