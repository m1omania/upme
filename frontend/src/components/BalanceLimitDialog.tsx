import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

interface BalanceLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTopUp: () => void;
  onContinue: () => void;
}

export default function BalanceLimitDialog({
  open,
  onOpenChange,
  onTopUp,
  onContinue,
}: BalanceLimitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg 
        !fixed !bottom-0 !left-[50%] !right-auto !translate-x-[-50%] md:!bottom-auto md:!top-[50%] md:!translate-y-[-50%]
        !translate-y-0 md:!translate-y-[-50%]
        !w-[calc(100%-2rem)] sm:!w-full max-w-md
        rounded-t-2xl md:rounded-lg
        mb-0 md:mb-auto
        max-h-[90vh] md:max-h-none
        data-[state=open]:slide-in-from-bottom md:data-[state=open]:slide-in-from-left-1/2 md:data-[state=open]:slide-in-from-top-[48%]
        data-[state=closed]:slide-out-to-bottom md:data-[state=closed]:slide-out-to-left-1/2 md:data-[state=closed]:slide-out-to-top-[48%]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Лимит достигнут
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Вы достигли лимита. Пополните баланс, чтобы генерировать письма.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onContinue}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Продолжить без генерации
          </Button>
          <Button
            onClick={onTopUp}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Пополнить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

