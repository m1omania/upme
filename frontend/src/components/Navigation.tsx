import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, User, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FiltersDialog from './FiltersDialog';
import { userApi, gamificationApi } from '../services/api';

// Компонент аватара пользователя
function UserAvatar({ photo, firstName, lastName, middleName }: { photo?: { small?: string; medium?: string; id?: string } | any; firstName?: string; lastName?: string; middleName?: string }) {
  const [imageError, setImageError] = useState(false);
  
  // Формируем инициалы
  const getInitials = () => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  };

  // Пробуем использовать фото - проверяем разные варианты структуры
  let photoUrl: string | undefined;
  if (photo) {
    if (typeof photo === 'string') {
      photoUrl = photo;
    } else if (photo.small) {
      photoUrl = photo.small;
    } else if (photo.medium) {
      photoUrl = photo.medium;
    } else if (photo.url) {
      photoUrl = photo.url;
    }
  }

  console.log('UserAvatar - photo data:', { photo, photoUrl, firstName, lastName });

  if (photoUrl && !imageError) {
    return (
      <img 
        src={photoUrl} 
        alt="Avatar"
        className="w-8 h-8 rounded-full object-cover border border-border"
        onError={(e) => {
          console.error('UserAvatar - Image load error:', photoUrl);
          setImageError(true);
        }}
      />
    );
  }

  // Показываем инициалы
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-border">
      <span className="text-sm font-semibold text-primary">{getInitials()}</span>
    </div>
  );
}

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Получаем баланс пользователя
  const { data: balanceData } = useQuery<number>({
    queryKey: ['user-balance'],
    queryFn: async () => {
      const response = await userApi.getBalance();
      if (response.success && response.data && typeof response.data === 'object' && 'balance' in response.data) {
        return (response.data as { balance: number }).balance;
      }
      return 10; // Дефолтное значение
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const balance = balanceData ?? 10;

  // Получаем XP пользователя
  const { data: xpData } = useQuery<number>({
    queryKey: ['user-xp'],
    queryFn: async () => {
      const response = await gamificationApi.getStats();
      if (response.success && response.data && typeof response.data === 'object' && 'xpProgress' in response.data) {
        return (response.data as { xpProgress: number }).xpProgress;
      }
      return 0;
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const xp = xpData ?? 0;

  // Получаем данные пользователя для аватара
  const { data: userData } = useQuery<any>({
    queryKey: ['user-hh-info'],
    queryFn: async () => {
      const response = await userApi.getHhInfo();
      if (response.success && response.data) {
        console.log('Navigation - User data:', response.data);
        return response.data.userInfo;
      }
      return null;
    },
    refetchInterval: 60000, // Обновляем каждую минуту
  });

  // Получаем фото из резюме, если его нет в userInfo
  const { data: profileData } = useQuery<any>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        console.log('Navigation - Profile data:', response.data);
        // Берем фото из первого резюме
        const firstResume = response.data.resumes?.[0];
        if (firstResume?.hh_data?.photo) {
          return {
            photo: firstResume.hh_data.photo,
            first_name: firstResume.hh_data.first_name || userData?.first_name,
            last_name: firstResume.hh_data.last_name || userData?.last_name,
            middle_name: firstResume.hh_data.middle_name || userData?.middle_name,
          };
        }
      }
      return null;
    },
    enabled: !userData?.photo, // Загружаем только если нет фото в userInfo
    refetchInterval: 60000,
  });

  // Используем данные из профиля, если есть фото, иначе из userInfo
  const avatarData = profileData?.photo ? profileData : userData;

  const navItems = [
    { path: '/swipe', label: 'Свайп', icon: Home },
    { path: '/dashboard', label: 'Прогресс', icon: null }, // Без иконки, будет показываться XP
    { path: '/profile', label: 'Профиль', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/swipe') {
      return location.pathname === '/swipe' || location.pathname.startsWith('/swipe/');
    }
    return location.pathname === path;
  };

  // Показываем логотип и фильтры только на странице /swipe, но не на странице отклика
  const isSwipePage = location.pathname === '/swipe';
  const isCoverLetterPage = location.pathname.includes('/letter');

  return (
    <>
      {/* Bottom Navigation Bar (скрыт на странице отклика) */}
      {!isCoverLetterPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-10 shadow-lg">
          <div className="flex items-center justify-around h-16 px-2 pb-safe">
            {/* Свайп */}
            {navItems.slice(0, 1).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {Icon && <Icon className="h-6 w-6" />}
                </button>
              );
            })}
            {/* Прогресс с XP */}
            {navItems.slice(1, 2).map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-xs font-bold">{xp}</span>
                  <span className="text-xs">очков</span>
                </button>
              );
            })}
            {/* Balance */}
                <button
                  onClick={() => navigate('/credits')}
                  className="flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-1 text-primary">
                    <Coins className="h-6 w-6" />
                    <span className="text-xs font-bold">{balance}</span>
                  </div>
                </button>
            {/* Профиль (последний элемент) */}
            {navItems.slice(2).map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-colors ${
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserAvatar 
                    photo={avatarData?.photo}
                    firstName={avatarData?.first_name}
                    lastName={avatarData?.last_name}
                    middleName={avatarData?.middle_name}
                  />
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Filters Dialog */}
      <FiltersDialog open={filtersOpen} onOpenChange={setFiltersOpen} />
    </>
  );
}
