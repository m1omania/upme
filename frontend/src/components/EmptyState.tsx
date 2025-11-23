import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  onRetry?: () => void;
}

export default function EmptyState({ message, onRetry }: EmptyStateProps) {
  return (
    <Container>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-lg text-muted-foreground text-center">{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Попробовать снова
          </Button>
        )}
      </div>
    </Container>
  );
}
