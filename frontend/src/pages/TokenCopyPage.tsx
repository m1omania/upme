import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@mui/material';
import { Copy, Check, Smartphone, QrCode } from 'lucide-react';

export default function TokenCopyPage() {
  const [token, setToken] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Автоматический импорт токена из URL
  useEffect(() => {
    const urlToken = searchParams.get('t');
    if (urlToken) {
      localStorage.setItem('token', urlToken);
      alert('✅ Токен импортирован! Перенаправление...');
      setTimeout(() => {
        navigate('/swipe', { replace: true });
      }, 1000);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleCopy = async () => {
    if (token) {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (token) {
      // Генерируем ссылку для телефона с токеном
      const networkUrl = `http://192.168.31.204:3000/token-copy?t=${encodeURIComponent(token)}`;
      await navigator.clipboard.writeText(networkUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const qrLink = token ? `http://192.168.31.204:3000/token-copy?t=${encodeURIComponent(token)}` : '';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Передача токена на телефон
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {token ? (
            <>
              <div className="flex flex-col items-center space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  📱 Отсканируй QR-код камерой телефона - токен импортируется автоматически!
                </p>
                <div className="bg-white p-4 rounded-lg border-2 border-primary shadow-lg">
                  <QRCodeSVG 
                    value={qrLink} 
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-md">
                  Или используй альтернативные способы ниже:
                </p>
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <Button onClick={handleCopyLink} className="w-full gap-2" variant="outline">
                  {linkCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Ссылка скопирована!
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      Скопировать ссылку для телефона
                    </>
                  )}
                </Button>
                <Button onClick={handleCopy} className="w-full gap-2" variant="outline">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Токен скопирован!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Скопировать токен (ручной ввод)
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Токен не найден. Авторизуйтесь сначала на компьютере.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Перейти на главную
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </Container>
  );
}

